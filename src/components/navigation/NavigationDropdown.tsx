import { ChevronDown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';

interface NavigationItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

interface NavigationDropdownProps {
  title: string;
  items: NavigationItem[];
  className?: string;
}

const NavigationDropdown = ({ title, items, className }: NavigationDropdownProps) => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  const hasActiveItem = items.some(item => isActive(item.path));

  return (
    <NavigationMenu className={className}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger 
            className={cn(
              "flex items-center gap-2 h-10 px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
              hasActiveItem && "bg-accent text-accent-foreground"
            )}
          >
            {title}
            <ChevronDown className="h-3 w-3" />
          </NavigationMenuTrigger>
          <NavigationMenuContent className="min-w-[200px] p-2 !bg-white border shadow-lg rounded-md !z-50 !opacity-100">
            <div className="grid gap-1">
              {items.map((item) => (
                <NavigationMenuLink key={item.name} asChild>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      isActive(item.path) && "bg-accent text-accent-foreground font-medium"
                    )}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                </NavigationMenuLink>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default NavigationDropdown;