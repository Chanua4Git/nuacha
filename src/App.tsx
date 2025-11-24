
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import DownloadPurchaseSuccess from "./pages/DownloadPurchaseSuccess";
import Payroll from "./pages/Payroll";
import { AuthProvider } from "./auth/contexts/AuthProvider";
import { AuthDemoProvider } from "./auth/contexts/AuthDemoProvider";
import Login from "./auth/components/Login";
import Signup from "./auth/components/Signup";
import ResetPassword from "./auth/components/ResetPassword";
import ResetPasswordConfirm from "./auth/components/reset-password/ResetPasswordConfirm";
import Dashboard from "./auth/components/Dashboard";
import ProtectedRoute from "./auth/components/ProtectedRoute";
import { useEffect } from "react";
import Demo from "./pages/Demo";
import Options from "./pages/Options";
import Navbar from "./components/Navbar";
import { ExpenseProvider } from "./context/ExpenseContext";
import AuthDemoDebugPanel from "./auth/components/AuthDemoDebugPanel";
import Reports from "./pages/Reports";
import Budget from "./pages/Budget";
import DemoBudget from "./pages/DemoBudget";
import Receipts from "./pages/Receipts";
import AuthenticationDemo from "./pages/AuthenticationDemo";
import Updates from "./pages/Updates";
import { OnboardingProvider } from "@/context/OnboardingContext";
import ScrollToTop from "@/components/navigation/ScrollToTop";

// Import onboarding helpers for development debugging
import '@/utils/onboardingHelpers';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Helper for "auth-demo" detection and clearing
function clearAuthDemoMode() {
  try {
    if (localStorage.getItem('authDemoActive') === 'true') {
      console.log('Clearing auth demo mode');
      localStorage.removeItem('authDemoActive');
      return true;
    }
  } catch {
    // Ignore localStorage errors
  }
  return false;
}

const App = () => {
  useEffect(() => {
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
    );
    
    // Clear auth demo mode when not on an authentication-demo page
    const pathname = window.location.pathname;
    if (!pathname.startsWith('/authentication-demo')) {
      clearAuthDemoMode();
    }
  }, []);

  // Enable debug panel during development
  const showDebugPanel = import.meta.env.DEV;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthDemoProvider>
          <ExpenseProvider>
            <TooltipProvider>
              <OnboardingProvider>
              <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    maxWidth: '90vw',
                  },
                }}
              />
              <div className="min-h-screen flex flex-col">
                <ScrollToTop />
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/app" element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    } />
                    <Route path="/demo" element={<Demo />} />
                    <Route path="/reports" element={
                      <ProtectedRoute>
                        <Reports />
                      </ProtectedRoute>
                    } />
                    <Route path="/budget" element={
                      <ProtectedRoute>
                        <Budget />
                      </ProtectedRoute>
                    } />
                    <Route path="/receipts" element={
                      <ProtectedRoute>
                        <Receipts />
                      </ProtectedRoute>
                    } />
                    <Route path="/demo/budget" element={<DemoBudget />} />
                    <Route path="/options" element={
                      <ProtectedRoute>
                        <Options />
                      </ProtectedRoute>
                    } />
                    <Route path="/payroll" element={<Payroll />} />
                    <Route path="/updates" element={<Updates />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/reset-password/confirm" element={<ResetPasswordConfirm />} />
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/authentication-demo" element={<AuthenticationDemo />} />
                    <Route path="/download-purchase-success" element={<DownloadPurchaseSuccess />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <AuthDemoDebugPanel visible={showDebugPanel} />
              </div>
            </OnboardingProvider>
            </TooltipProvider>
          </ExpenseProvider>
        </AuthDemoProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
