
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Home, PlusCircle, BarChart3, Calendar, Menu, X, LogOut, LogIn, ArrowRight, AlertTriangle } from 'lucide-react';
import { useExpense } from '@/context/ExpenseContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const HIDDEN_ROUTES = ['/', '/demo', '/options'];

const Navbar = () => {
  const { selectedFamily } = useExpense();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, authDemoActive, exitDemoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Only render navbar on non-hidden routes
  if (HIDDEN_ROUTES.includes(location.pathname)) {
    return (
      <header className="sticky top-0 z-10 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto flex justify-between items-center h-16 px-4">
          <h1 className="text-xl font-bold">
            <Link to="/">Nuacha</Link>
          </h1>
          <div className="flex items-center gap-2">
            {authDemoActive && (
              <Button 
                variant="outline" 
                size="sm"
                className="hidden sm:flex items-center gap-1 text-amber-600 border-amber-300 bg-amber-50"
                onClick={exitDemoMode}
              >
                <AlertTriangle className="h-4 w-4" />
                Exit Demo Mode
              </Button>
            )}
            
            {user && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/app')}
                  className="hidden sm:flex"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={async () => {
                    try {
                      await signOut();
                      toast.success('Signed out successfully');
                      navigate('/');
                    } catch (error) {
                      console.error('Logout error:', error);
                      toast.error('Error signing out');
                    }
                  }}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  <span>Sign out</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
    );
  }

  const handleAuthAction = async () => {
    if (user) {
      try {
        await signOut();
        toast.success('Signed out successfully');
      } catch (error) {
        console.error('Logout error:', error);
        toast.error('Error signing out');
      }
    } else {
      navigate('/login');
    }
  };

  const navItems = user ? [
    { name: 'Dashboard', icon: <Home className="h-5 w-5" />, path: '/dashboard' },
    { name: 'Add Expense', icon: <PlusCircle className="h-5 w-5" />, path: '/app' },
    { name: 'Reports', icon: <BarChart3 className="h-5 w-5" />, path: '/reports' },
    { name: 'Reminders', icon: <Calendar className="h-5 w-5" />, path: '/reminders' },
  ] : [];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const AuthButton = () => (
    <Button
      variant="ghost"
      className={`${user ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : ''}`}
      onClick={handleAuthAction}
    >
      {user ? (
        <>
          <LogOut className="h-5 w-5 mr-2" />
          <span className="hidden lg:inline">Sign out</span>
        </>
      ) : (
        <>
          <LogIn className="h-5 w-5 mr-2" />
          <span className="hidden lg:inline">Sign in</span>
        </>
      )}
    </Button>
  );

  return (
    <header className="sticky top-0 z-10 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto flex justify-between items-center h-16 px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">
            <Link to={user ? "/dashboard" : "/"}>Nuacha</Link>
            {selectedFamily && (
              <span 
                className="ml-2 text-sm font-medium px-2 py-1 rounded-full" 
                style={{ backgroundColor: `${selectedFamily.color}20`, color: selectedFamily.color }}
              >
                {selectedFamily.name}
              </span>
            )}
          </h1>
          {authDemoActive && (
            <div className="flex items-center">
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full hidden sm:inline-block">
                Demo Mode
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2 text-amber-600 hidden sm:flex items-center"
                onClick={exitDemoMode}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Exit Demo
              </Button>
            </div>
          )}
        </div>

        {isMobile ? (
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="focus:outline-none">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80%] max-w-[300px] p-0">
              <div className="flex flex-col h-full">
                <div className="border-b p-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-lg">Menu</h2>
                    {authDemoActive && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                        Demo Mode
                      </span>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close menu</span>
                  </Button>
                </div>
                
                <div className="flex-1 overflow-auto py-2">
                  <nav className="flex flex-col gap-1 p-2">
                    {navItems.map((item) => (
                      <Button
                        key={item.name}
                        variant={isActive(item.path) ? "secondary" : "ghost"}
                        className="justify-start h-12 text-base w-full"
                        onClick={() => setIsMenuOpen(false)}
                        asChild
                      >
                        <Link to={item.path} className="flex items-center gap-3">
                          {item.icon}
                          {item.name}
                        </Link>
                      </Button>
                    ))}
                    
                    {authDemoActive && (
                      <Button
                        variant="outline"
                        className="justify-start h-12 text-base w-full text-amber-600 border-amber-300 bg-amber-50"
                        onClick={() => {
                          setIsMenuOpen(false);
                          exitDemoMode();
                        }}
                      >
                        <AlertTriangle className="h-4 w-4 mr-3" />
                        Exit Demo Mode
                      </Button>
                    )}
                  </nav>
                </div>
                
                <div className="border-t p-4">
                  <Button
                    variant="ghost"
                    className={`justify-start w-full h-12 text-base ${
                      user ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : ''
                    }`}
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleAuthAction();
                    }}
                  >
                    {user ? (
                      <>
                        <LogOut className="h-5 w-5 mr-3" />
                        Sign out
                      </>
                    ) : (
                      <>
                        <LogIn className="h-5 w-5 mr-3" />
                        Sign in
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Button 
                key={item.name} 
                variant={isActive(item.path) ? "secondary" : "ghost"} 
                className="flex items-center gap-2" 
                asChild
              >
                <Link to={item.path}>
                  {item.icon}
                  <span className="hidden lg:inline">{item.name}</span>
                </Link>
              </Button>
            ))}
            {authDemoActive && (
              <Button 
                variant="outline" 
                size="sm"
                className="text-amber-600 border-amber-300 bg-amber-50 flex items-center gap-1 mr-2"
                onClick={exitDemoMode}
              >
                <AlertTriangle className="h-4 w-4" />
                Exit Demo Mode
              </Button>
            )}
            <AuthButton />
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
