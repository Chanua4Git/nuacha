
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth/contexts/AuthProvider';

const DemoModeIndicator = () => {
  const { authDemoActive, exitDemoMode } = useAuth();
  
  if (!authDemoActive) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        variant="outline" 
        size="sm"
        className="bg-amber-50 border-amber-200 text-amber-700 shadow-md flex items-center gap-2 px-3 py-2"
        onClick={exitDemoMode}
      >
        <AlertTriangle className="h-4 w-4" />
        <span>Exit Demo Mode</span>
      </Button>
    </div>
  );
};

export default DemoModeIndicator;
