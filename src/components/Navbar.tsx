
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Home, PlusCircle, BarChart3, Calendar, Menu, X, LogOut } from 'lucide-react';
import { useExpense } from '@/context/ExpenseContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabaseClient } from '@/auth/utils/supabaseClient';
import { toast } from 'sonner';

const Navbar = () => {
  const { selectedFamily } = useExpense();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await supabaseClient.auth.signOut();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error signing out');
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: <Home className="h-5 w-5" />, path: '/' },
    { name: 'Add Expense', icon: <PlusCircle className="h-5 w-5" />, path: '/add-expense' },
    { name: 'Reports', icon: <BarChart3 className="h-5 w-5" />, path: '/reports' },
    { name: 'Reminders', icon: <Calendar className="h-5 w-5" />, path: '/reminders' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-10 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto flex justify-between items-center h-16 px-4">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">
            Nuacha
            {selectedFamily && (
              <span 
                className="ml-2 text-sm font-medium px-2 py-1 rounded-full" 
                style={{ backgroundColor: `${selectedFamily.color}20`, color: selectedFamily.color }}
              >
                {selectedFamily.name}
              </span>
            )}
          </h1>
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
                  <h2 className="font-semibold text-lg">Menu</h2>
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
                  </nav>
                </div>
                
                <div className="border-t p-4">
                  <Button
                    variant="ghost"
                    className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50 w-full h-12 text-base"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sign out
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
            <Button
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-2" />
              <span className="hidden lg:inline">Sign out</span>
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
