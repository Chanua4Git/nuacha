
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Home, PlusCircle, BarChart3, Calendar, Menu, X, LogOut, LogIn, ArrowRight, Settings, Users, Calculator, FileBarChart, PieChart, FileImage } from 'lucide-react';
import { useExpense } from '@/context/ExpenseContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import NavigationDropdown from '@/components/navigation/NavigationDropdown';

// Only hide navbar on auth pages and special demo pages
const HIDDEN_ROUTES = ['/login', '/signup', '/reset-password', '/reset-password/confirm'];

const Navbar = () => {
  const { selectedFamily } = useExpense();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, authDemoActive } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Only hide navbar on auth pages
  if (HIDDEN_ROUTES.includes(location.pathname)) {
    return null;
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

  // Expense dropdown items
  const expenseItems = [
    { name: 'Dashboard', icon: <Home className="h-4 w-4" />, path: '/dashboard' },
    { name: 'Add Expense', icon: <PlusCircle className="h-4 w-4" />, path: '/app' },
    { name: 'Budget & Planning', icon: <PieChart className="h-4 w-4" />, path: '/budget' },
    { name: 'Receipt Management', icon: <FileImage className="h-4 w-4" />, path: '/receipts' },
    { name: 'Reports', icon: <BarChart3 className="h-4 w-4" />, path: '/reports' },
    { name: 'Settings', icon: <Settings className="h-4 w-4" />, path: '/options' },
  ];

  // Payroll dropdown items
  const payrollItems = [
    { name: 'Payroll Dashboard', icon: <FileBarChart className="h-4 w-4" />, path: '/payroll' },
  ];

  // Mobile navigation items (flattened for mobile)
  const mobileNavItems = user ? [
    ...expenseItems,
    { name: 'Reminders', icon: <Calendar className="h-5 w-5" />, path: '/reminders' },
    ...payrollItems,
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
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm">
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
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full hidden sm:inline-block">
              Demo Mode
            </span>
          )}
        </div>

        {authDemoActive && !isMobile && (
          <div className="flex items-center">
            <Button 
              variant="ghost"
              size="sm"
              className="mr-2"
              onClick={() => navigate('/authentication-demo')}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Back to Demo Guide
            </Button>
          </div>
        )}

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
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
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
                    {mobileNavItems.map((item) => (
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
                    <Button
                      variant="ghost"
                      className="justify-start h-12 text-base w-full"
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate('/authentication-demo');
                      }}
                    >
                      Authentication Demo
                    </Button>
                    {authDemoActive && (
                      <Button
                        variant="ghost"
                        className="justify-start h-12 text-base w-full"
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate('/authentication-demo');
                        }}
                      >
                        <ArrowRight className="h-5 w-5 mr-3" />
                        Back to Demo Guide
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
            {user && (
              <>
                <NavigationDropdown title="Expense" items={expenseItems} />
                <Button 
                  variant={isActive('/reminders') ? "secondary" : "ghost"} 
                  className="flex items-center gap-2" 
                  asChild
                >
                  <Link to="/reminders">
                    <Calendar className="h-4 w-4" />
                    <span className="hidden lg:inline">Reminders</span>
                  </Link>
                </Button>
                <NavigationDropdown title="Payroll" items={payrollItems} />
              </>
            )}
            <Button 
              variant={isActive('/authentication-demo') ? "secondary" : "ghost"}
              asChild
            >
              <Link to="/authentication-demo">Auth Demo</Link>
            </Button>
            <AuthButton />
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
