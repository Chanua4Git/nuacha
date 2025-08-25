import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Sparkles, X, RefreshCw } from 'lucide-react';
import { useComprehensiveCategorySeeding } from '@/hooks/useComprehensiveCategorySeeding';
import { useAuth } from '@/auth/contexts/AuthProvider';

export const CategorySeedingBanner = () => {
  const { user } = useAuth();
  const { seedComprehensiveCategories, checkNeedsSeeding, isSeeding } = useComprehensiveCategorySeeding();
  const [needsSeeding, setNeedsSeeding] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSeeding = async () => {
      if (!user) {
        setIsChecking(false);
        return;
      }

      try {
        const needsIt = await checkNeedsSeeding();
        setNeedsSeeding(needsIt);
        
        // Don't show banner if dismissed in this session
        const dismissed = sessionStorage.getItem('category-seeding-dismissed');
        setIsDismissed(dismissed === 'true');
      } catch (error) {
        console.error('Error checking seeding status:', error);
        setNeedsSeeding(true); // Assume they need it if we can't check
      } finally {
        setIsChecking(false);
      }
    };

    checkSeeding();
  }, [user, checkNeedsSeeding]);

  const handleSeed = async () => {
    const success = await seedComprehensiveCategories();
    if (success) {
      setNeedsSeeding(false);
      setIsDismissed(true);
      sessionStorage.setItem('category-seeding-dismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('category-seeding-dismissed', 'true');
  };

  // Don't show if checking, user not logged in, doesn't need seeding, or dismissed
  if (isChecking || !user || !needsSeeding || isDismissed) {
    return null;
  }

  return (
    <Card className="mx-4 mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-foreground">
                Upgrade Your Category System
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                New
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              Get the complete 15-category hierarchical system with 100+ subcategories for better expense tracking and smart categorization.
            </p>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <AlertCircle className="h-3 w-3" />
              <span>Includes: Housing & Utilities, Caregiving & Medical, Clothing & Fashion, Technology & Electronics, and more</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleSeed} 
                disabled={isSeeding}
                size="sm"
                className="h-8 px-3 text-xs"
              >
                {isSeeding ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />
                    Seed Categories
                  </>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleDismiss}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Maybe later
              </Button>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0 h-6 w-6 p-0 text-muted-foreground/50 hover:text-muted-foreground"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};