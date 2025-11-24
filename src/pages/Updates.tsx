import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReleaseNotesList } from '@/components/updates/ReleaseNotesList';
import { UnifiedFeedbackForm } from '@/components/updates/UnifiedFeedbackForm';
import { Sparkles, GraduationCap, Eye, MessageSquare } from 'lucide-react';

export default function Updates() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'whats-new';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Developer Updates & Learning Center</h1>
          <p className="text-lg text-muted-foreground">
            Stay updated, learn how to use Nuacha, and share your feedback
          </p>
        </div>

        {/* Tabs */}
        <Tabs
          defaultValue={initialTab}
          onValueChange={(value) => setSearchParams({ tab: value })}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
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
          </TabsList>

          <TabsContent value="whats-new" className="space-y-6">
            <ReleaseNotesList />
          </TabsContent>

          <TabsContent value="learning" className="space-y-6">
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-semibold mb-2">Learning Center</h3>
              <p className="text-muted-foreground">
                Interactive tutorials and guides coming soon!
              </p>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <div className="text-center py-12">
              <Eye className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-semibold mb-2">Feature Showcase</h3>
              <p className="text-muted-foreground">
                Visual demonstrations of Nuacha's capabilities coming soon!
              </p>
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <UnifiedFeedbackForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
