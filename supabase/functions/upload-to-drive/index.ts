import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { google } from 'npm:googleapis@128';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { file, fileName, mimeType, metadata } = await req.json();
    
    console.log('📤 Drive upload request:', { fileName, metadata });
    
    // Get service account credentials from secret
    const serviceAccountKey = Deno.env.get('GOOGLE_DRIVE_SERVICE_ACCOUNT');
    if (!serviceAccountKey) {
      throw new Error('GOOGLE_DRIVE_SERVICE_ACCOUNT secret not configured');
    }
    
    const serviceAccount = JSON.parse(serviceAccountKey);
    
    if (!serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error('Invalid service account configuration');
    }
    
    // Authenticate with Google Drive
    const auth = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    
    const drive = google.drive({ version: 'v3', auth });
    
    // Get or create family folder
    console.log('📁 Creating/finding family folder:', metadata.familyName);
    const familyFolderId = await getOrCreateFolder(
      drive,
      metadata.familyName,
      'root'
    );
    
    // Get or create category folder
    console.log('📁 Creating/finding category folder:', metadata.categoryName);
    const categoryFolderId = await getOrCreateFolder(
      drive,
      metadata.categoryName,
      familyFolderId
    );
    
    // Upload file
    console.log('⬆️ Uploading file to Drive...');
    const fileBuffer = Uint8Array.from(atob(file), c => c.charCodeAt(0));
    
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [categoryFolderId],
        description: `${metadata.description || ''} - $${metadata.amount || 'N/A'}`,
      },
      media: {
        mimeType,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(fileBuffer);
            controller.close();
          }
        })
      },
      fields: 'id, webViewLink, webContentLink'
    });
    
    // Make file accessible via link (view-only)
    console.log('🔐 Setting file permissions...');
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });
    
    console.log('✅ Drive upload complete:', response.data.id);
    
    return new Response(
      JSON.stringify({
        fileId: response.data.id,
        url: response.data.webViewLink,
        folderPath: `${metadata.familyName}/${metadata.categoryName}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Drive upload error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getOrCreateFolder(drive: any, folderName: string, parentId: string) {
  // Search for existing folder
  const response = await drive.files.list({
    q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)'
  });
  
  if (response.data.files.length > 0) {
    console.log('📂 Found existing folder:', folderName);
    return response.data.files[0].id;
  }
  
  // Create folder
  console.log('📂 Creating new folder:', folderName);
  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    },
    fields: 'id'
  });
  
  return folder.data.id;
}
