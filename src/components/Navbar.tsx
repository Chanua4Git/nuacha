
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Home, PlusCircle, BarChart3, Calendar, Menu, X } from 'lucide-react';
import { useExpense } from '@/context/ExpenseContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

const Navbar = () => {
  const { selectedFamily } = useExpense();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', icon: <Home className="h-5 w-5 mr-2" />, path: '/' },
    { name: 'Add Expense', icon: <PlusCircle className="h-5 w-5 mr-2" />, path: '/add-expense' },
    { name: 'Reports', icon: <BarChart3 className="h-5 w-5 mr-2" />, path: '/reports' },
    { name: 'Reminders', icon: <Calendar className="h-5 w-5 mr-2" />, path: '/reminders' },
  ];

  return (
    <header className="sticky top-0 z-10 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto flex justify-between items-center h-16 px-4">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">
            Household Insight
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
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col mt-8 space-y-2">
                {navItems.map((item) => (
                  <Button
                    key={item.name}
                    variant="ghost"
                    className="justify-start"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.icon}
                    {item.name}
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <nav className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <Button key={item.name} variant="ghost" className="flex items-center">
                {item.icon}
                {item.name}
              </Button>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
