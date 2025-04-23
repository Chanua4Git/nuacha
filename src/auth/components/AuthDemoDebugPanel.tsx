
import React from 'react';
import { useAuthDemo } from '../contexts/AuthDemoProvider';
import { AuthDemoStep } from '../services/AuthDemoService';
import { useAuth } from '../contexts/AuthProvider';

interface AuthDemoDebugPanelProps {
  visible?: boolean;
}

// Helper to convert enum values to readable names
const getStepName = (step: AuthDemoStep): string => {
  switch (step) {
    case AuthDemoStep.Initial: return "Initial";
    case AuthDemoStep.SignedUp: return "Signed Up";
    case AuthDemoStep.LoggedIn: return "Logged In";
    case AuthDemoStep.ResetPassword: return "Reset Password";
    case AuthDemoStep.Completed: return "Completed";
    default: return `Unknown (${step})`;
  }
};

export const AuthDemoDebugPanel: React.FC<AuthDemoDebugPanelProps> = ({ visible = false }) => {
  const { demoStep, demoActive, isDemoVerified, verificationEmail } = useAuthDemo();
  const { user, authDemoActive } = useAuth();

  // Only show in development and when visible prop is true
  if (import.meta.env.PROD || !visible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 text-white p-4 rounded-lg shadow-lg z-50 text-xs w-96 opacity-80 hover:opacity-100 transition-opacity">
      <h4 className="font-semibold mb-2 flex justify-between">
        Auth Demo Debug
        <span className={`px-2 py-0.5 rounded ${demoActive ? 'bg-green-600' : 'bg-gray-600'}`}>
          {demoActive ? 'Active' : 'Inactive'}
        </span>
      </h4>
      <div className="space-y-2 font-mono">
        <div>
          <span className="text-slate-400">Current Step:</span>{' '}
          <span className="text-yellow-300">{getStepName(demoStep)} ({demoStep})</span>
        </div>
        <div>
          <span className="text-slate-400">Auth Context Demo Active:</span>{' '}
          <span className={authDemoActive ? 'text-green-400' : 'text-red-400'}>
            {authDemoActive ? 'Yes' : 'No'}
          </span>
        </div>
        <div>
          <span className="text-slate-400">Verified:</span>{' '}
          <span className={isDemoVerified ? 'text-green-400' : 'text-red-400'}>
            {isDemoVerified ? 'Yes' : 'No'}
          </span>
        </div>
        <div>
          <span className="text-slate-400">Demo Email:</span>{' '}
          <span className="text-blue-300">{verificationEmail || 'None'}</span>
        </div>
        <div>
          <span className="text-slate-400">User Logged In:</span>{' '}
          <span className={user ? 'text-green-400' : 'text-red-400'}>
            {user ? 'Yes' : 'No'}
          </span>
        </div>
        {user && (
          <div>
            <span className="text-slate-400">User Email:</span>{' '}
            <span className="text-blue-300">{user.email}</span>
          </div>
        )}
        <div className="text-xs text-slate-500 mt-2">
          URL Search: {window.location.search || '(none)'}
        </div>
      </div>
    </div>
  );
};

export default AuthDemoDebugPanel;
