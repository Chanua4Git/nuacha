
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./auth/contexts/AuthProvider";
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
import AuthDemoLanding from "./pages/auth-demo/AuthDemoLanding";
import AuthDemoPlans from "./pages/auth-demo/AuthDemoPlans";
import AuthDemoFeatures from "./pages/auth-demo/AuthDemoFeatures";

// New: custom hook for hiding navbar on /auth-demo
import { useLocation as useRRLocation } from "react-router-dom";

const queryClient = new QueryClient();

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
  }, []);

  const location = useRRLocation();
  const hideNavbar = /^\/auth-demo(\/.*)?$/.test(location.pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ExpenseProvider>
          <TooltipProvider>
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  maxWidth: '90vw',
                },
              }}
            />
            <div className="min-h-screen flex flex-col">
              {!hideNavbar && <Navbar />}
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/app" element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  } />
                  <Route path="/demo" element={<Demo />} />
                  <Route path="/options" element={<Options />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/reset-password/confirm" element={<ResetPasswordConfirm />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/auth-demo" element={<AuthDemoLanding />} />
                  <Route path="/auth-demo/plans" element={<AuthDemoPlans />} />
                  <Route path="/auth-demo/features" element={<AuthDemoFeatures />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </TooltipProvider>
        </ExpenseProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
