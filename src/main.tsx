
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { BudgetPreviewProvider } from './context/BudgetPreviewContext';

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Global preview provider for SAHM budget data */}
      <BudgetPreviewProvider>
        <App />
      </BudgetPreviewProvider>
    </BrowserRouter>
  </React.StrictMode>
);
