
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { BudgetPreviewProvider } from './context/BudgetPreviewContext';
import { AuthPreviewProvider } from './contexts/AuthPreviewContext';

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Auth preview provider enables ?_preview_auth=false for GIF recording */}
      <AuthPreviewProvider>
        {/* Global preview provider for SAHM budget data */}
        <BudgetPreviewProvider>
          <App />
        </BudgetPreviewProvider>
      </AuthPreviewProvider>
    </BrowserRouter>
  </React.StrictMode>
);
