import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { testMindeeConnection } from '@/utils/receipt/debugHelpers';
import { Loader2, CheckCircle, XCircle, Bug } from 'lucide-react';

interface DebugInfo {
  apiStatus: 'unknown' | 'testing' | 'success' | 'failed';
  lastTest?: Date;
  errorDetails?: string;
}

const ReceiptProcessingDebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    apiStatus: 'unknown'
  });

  const handleTestConnection = async () => {
    setDebugInfo(prev => ({ ...prev, apiStatus: 'testing' }));
    
    try {
      const success = await testMindeeConnection();
      setDebugInfo({
        apiStatus: success ? 'success' : 'failed',
        lastTest: new Date(),
        errorDetails: success ? undefined : 'API connection test failed'
      });
    } catch (error) {
      setDebugInfo({
        apiStatus: 'failed',
        lastTest: new Date(),
        errorDetails: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const getStatusBadge = () => {
    switch (debugInfo.apiStatus) {
      case 'testing':
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Testing</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Working</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="w-5 h-5" />
          Receipt Processing Debug
        </CardTitle>
        <CardDescription>
          Development tools for debugging receipt processing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">API Status:</span>
          {getStatusBadge()}
        </div>
        
        {debugInfo.lastTest && (
          <div className="text-sm text-muted-foreground">
            Last tested: {debugInfo.lastTest.toLocaleTimeString()}
          </div>
        )}
        
        {debugInfo.errorDetails && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {debugInfo.errorDetails}
          </div>
        )}
        
        <div className="space-y-2">
          <Button 
            onClick={handleTestConnection} 
            disabled={debugInfo.apiStatus === 'testing'}
            size="sm"
            variant="outline"
            className="w-full"
          >
            {debugInfo.apiStatus === 'testing' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              'Test API Connection'
            )}
          </Button>
          
          <Button 
            onClick={() => {
              console.log('Debug info:', {
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                localStorage: localStorage.length,
                sessionStorage: sessionStorage.length,
                cookiesEnabled: navigator.cookieEnabled,
                online: navigator.onLine
              });
            }}
            size="sm"
            variant="ghost"
            className="w-full text-xs"
          >
            Log System Info
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          This panel only appears in development mode
        </div>
      </CardContent>
    </Card>
  );
};

export default ReceiptProcessingDebugPanel;