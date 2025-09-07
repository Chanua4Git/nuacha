import React, { ReactNode } from 'react';
import { DemoExpenseProvider } from '@/context/DemoExpenseContext';
import { DemoExpenseProvider as DemoExpenseContextProvider } from './DemoExpenseContext';

interface DemoAwareWrapperProps {
  children: ReactNode;
  isDemo?: boolean;
}

// Wrapper component that provides demo context when needed
const DemoAwareWrapper = ({ children, isDemo = false }: DemoAwareWrapperProps) => {
  if (isDemo) {
    return (
      <DemoExpenseProvider>
        <DemoExpenseContextProvider>
          {children}
        </DemoExpenseContextProvider>
      </DemoExpenseProvider>
    );
  }
  
  return <>{children}</>;
};

export default DemoAwareWrapper;