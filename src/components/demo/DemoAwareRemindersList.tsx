import React from 'react';
import RemindersList from '@/components/RemindersList';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const DemoAwareRemindersList = () => {
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Demo reminders - Sign up to create real reminders
        </AlertDescription>
      </Alert>
      
      <RemindersList />
    </div>
  );
};

export default DemoAwareRemindersList;