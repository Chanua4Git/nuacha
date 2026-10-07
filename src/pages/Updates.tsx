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
import { Sparkles, GraduationCap, Eye, MessageSquare, Database, Settings, CalendarDays, HeartHandshake, WandSparkles, MapPin } from 'lucide-react';
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
            <section className="border-y bg-accent/25 px-4 py-6 sm:px-6" aria-labelledby="setup-invitation-heading">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-primary">Now booking</p>
                  <h2 id="setup-invitation-heading" className="text-2xl font-semibold">Want Nuacha set up with you?</h2>
                  <p className="max-w-3xl text-muted-foreground">Choose a guided starting session for TT$100, or begin done-for-you support with TT$300 onboarding and planning. Further work and visits are quoted separately after agreeing your priorities. Meet remotely by video or in person.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Button asChild className="h-auto min-h-12 justify-start whitespace-normal py-3">
                    <a href="/setup?package=hand_holding&mode=remote#setup-details"><HeartHandshake className="mr-2 h-4 w-4 shrink-0" />Hand-holding · TT$100</a>
                  </Button>
                  <Button asChild variant="outline" className="h-auto min-h-12 justify-start whitespace-normal py-3">
                    <a href="/setup?package=done_for_you&mode=remote#setup-details"><WandSparkles className="mr-2 h-4 w-4 shrink-0" />Done-for-you onboarding · TT$300</a>
                  </Button>
                  <Button asChild variant="outline" className="h-auto min-h-12 justify-start whitespace-normal py-3">
                    <a href="/setup?package=hand_holding&mode=in_person#setup-details"><MapPin className="mr-2 h-4 w-4 shrink-0" />Choose an in-person place</a>
                  </Button>
                  <Button asChild variant="outline" className="h-auto min-h-12 justify-start whitespace-normal py-3">
                    <a href="/setup?section=calendar#setup-calendar"><CalendarDays className="mr-2 h-4 w-4 shrink-0" />See available dates</a>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Pick your option, place and date first, then choose WiPay, pay what you can, or bank transfer.</p>
                <div className="border-l-2 border-primary pl-3 text-sm">
                  <p className="font-medium">October 7, 2026 · Booking is clearer</p>
                  <p className="text-muted-foreground">You can now compare both setup options, choose remote or an approved in-person meeting place, see live calendar availability and continue to your preferred payment route.</p>
                </div>
              </div>
            </section>
            <ReleaseNotesList />
          </TabsContent>

          <TabsContent value="learning" className="space-y-6">
            <LearningCenter />
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <div className="text-center">
              <a href="/dashboard#nuacha-map" className="text-sm text-primary underline underline-offset-4">
                Explore Nuacha — see your personal map of everything you can do
              </a>
            </div>
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
