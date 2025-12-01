import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReleaseNotesList } from '@/components/updates/ReleaseNotesList';
import { UnifiedFeedbackForm } from '@/components/updates/UnifiedFeedbackForm';
import { FeatureShowcase } from '@/components/updates/FeatureShowcase';
import { LearningCenter } from '@/components/updates/LearningCenter';
import { LearningVisualAdmin } from '@/components/updates/LearningVisualAdmin';
import { AdminTaskList } from '@/components/updates/AdminTaskList';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sparkles, GraduationCap, Eye, MessageSquare, Database, Settings } from 'lucide-react';
import { seedReleaseNotes } from '@/utils/seedReleaseNotes';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRole } from '@/hooks/useAdminRole';

export default function Updates() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'whats-new';
  const [isSeeding, setIsSeeding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { isAdmin, isLoading: isLoadingAdmin } = useAdminRole();

  useEffect(() => {
    // Check authentication status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSeedData = async () => {
    setIsSeeding(true);
    await seedReleaseNotes();
    setIsSeeding(false);
    // Refresh the page to show new data
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Developer Updates & Learning Center</h1>
          <p className="text-lg text-muted-foreground">
            Stay updated, learn how to use Nuacha, and share your feedback
          </p>
          
          {/* Dev seed button - only shown when authenticated */}
          {isAuthenticated && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedData}
                disabled={isSeeding}
                className="gap-2"
              >
                <Database className="w-4 h-4" />
                {isSeeding ? 'Seeding...' : 'Seed Release Notes'}
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs
          defaultValue={initialTab}
          onValueChange={(value) => setSearchParams({ tab: value })}
          className="w-full"
        >
          <TabsList className={`grid w-full ${isAuthenticated ? 'grid-cols-5' : 'grid-cols-4'} mb-8`}>
            <TabsTrigger value="whats-new" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">What's New</span>
              <span className="sm:hidden">New</span>
            </TabsTrigger>
            <TabsTrigger value="learning" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Learning</span>
              <span className="sm:hidden">Learn</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Features</span>
              <span className="sm:hidden">Features</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Feedback</span>
              <span className="sm:hidden">Feedback</span>
            </TabsTrigger>
            {isAuthenticated && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
                <span className="sm:hidden">Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="whats-new" className="space-y-6">
            <ReleaseNotesList />
          </TabsContent>

          <TabsContent value="learning" className="space-y-6">
            <LearningCenter />
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <FeatureShowcase />
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <UnifiedFeedbackForm />
          </TabsContent>

          {isAuthenticated && (
            <TabsContent value="admin" className="space-y-8">
              {isLoadingAdmin ? (
                <div className="text-center py-8">Loading...</div>
              ) : isAdmin ? (
                <>
                  {/* Admin Task List - Only for admins */}
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold">Development Tasks</h2>
                      <p className="text-muted-foreground">Track your working list (TTD)</p>
                    </div>
                    <AdminTaskList />
                  </div>

                  <Separator className="my-8" />

                  {/* Learning Visual Generator */}
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold">Learning Visual Generator</h2>
                      <p className="text-muted-foreground">Create and manage visual content for learning modules</p>
                    </div>
                    <LearningVisualAdmin />
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Admin access required to view this section
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
