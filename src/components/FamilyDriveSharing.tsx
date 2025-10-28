import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { shareDriveFolderWithEmails } from '@/utils/receipt/driveStorage';
import { Share2, Mail, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FamilyDriveSharingProps {
  familyId: string;
  familyName: string;
  driveFolderId?: string | null;
  sharedEmails?: string[];
  onUpdate?: () => void;
}

export function FamilyDriveSharing({
  familyId,
  familyName,
  driveFolderId,
  sharedEmails = [],
  onUpdate
}: FamilyDriveSharingProps) {
  const [newEmail, setNewEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  
  const handleShareWithEmail = async () => {
    if (!newEmail || !driveFolderId) return;
    
    setIsSharing(true);
    const success = await shareDriveFolderWithEmails(driveFolderId, [newEmail]);
    setIsSharing(false);
    
    if (success) {
      setNewEmail('');
      onUpdate?.();
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Google Drive Sharing - {familyName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Share this family's receipts with others via Google Drive
          </p>
          
          {sharedEmails.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {sharedEmails.map((email) => (
                <Badge key={email} variant="secondary" className="gap-1">
                  <Mail className="h-3 w-3" />
                  {email}
                  <button className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="email@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleShareWithEmail()}
            />
            <Button
              onClick={handleShareWithEmail}
              disabled={!newEmail || isSharing || !driveFolderId}
            >
              {isSharing ? 'Sharing...' : 'Share'}
            </Button>
          </div>
          
          {!driveFolderId && (
            <p className="text-sm text-amber-600 mt-2">
              Upload a receipt first to create the Drive folder
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
