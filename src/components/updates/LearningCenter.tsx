import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Wallet, PieChart, Zap, RotateCcw } from 'lucide-react';
import { learningTracks, learningModules } from '@/constants/learningCenterData';
import { LearningModuleCard } from './LearningModuleCard';
import { useLearningProgress } from '@/hooks/useLearningProgress';

const trackIcons = {
  'Sparkles': Sparkles,
  'Wallet': Wallet,
  'PieChart': PieChart,
  'Zap': Zap
};

export function LearningCenter() {
  const [searchParams] = useSearchParams();
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const { getOverallProgress, resetProgress } = useLearningProgress();
  const overallProgress = getOverallProgress(learningModules.length);

  // Read URL parameters for deep linking
  const urlModuleId = searchParams.get('module');
  const urlStepId = searchParams.get('step');

  // Filter modules by selected track
  const filteredModules = selectedTrack
    ? learningModules.filter(m => m.track === selectedTrack)
    : learningModules;

  // Get Start Here modules for the highlighted rail
  const startHereModules = learningModules.filter(m => m.track === 'Start Here');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-foreground">
          Nuacha Learning
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Pick one small thing, learn it in 2–3 minutes, and try it right away.
        </p>

        {/* Overall Progress */}
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Your progress</span>
            <span className="font-medium">
              {overallProgress.completedModules} of {overallProgress.totalModules} modules
            </span>
          </div>
          <Progress value={overallProgress.percentage} className="h-3" />
        </div>
      </div>

      {/* Track Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 justify-center">
        <Button
          variant={selectedTrack === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedTrack(null)}
        >
          All Tracks
        </Button>
        {learningTracks.map(track => {
          const IconComponent = trackIcons[track.icon as keyof typeof trackIcons];
          return (
            <Button
              key={track.id}
              variant={selectedTrack === track.title ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTrack(track.title)}
              className="gap-2"
            >
              {IconComponent && <IconComponent className="w-4 h-4" />}
              {track.title}
            </Button>
          );
        })}
      </div>

      {/* Start Here Highlighted Rail */}
      {!selectedTrack && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5" />
              Start Here
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              New to Nuacha? Begin your journey with these essential basics.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {startHereModules.map(module => (
              <LearningModuleCard 
                key={module.id} 
                module={module}
                initialExpanded={urlModuleId === module.id}
                highlightStepId={urlModuleId === module.id ? urlStepId : null}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Track Description (when filtered) */}
      {selectedTrack && (
        <Card className="bg-accent/30 border-accent">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              {(() => {
                const track = learningTracks.find(t => t.title === selectedTrack);
                const IconComponent = track ? trackIcons[track.icon as keyof typeof trackIcons] : null;
                return (
                  <>
                    {IconComponent && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{selectedTrack}</h3>
                      <p className="text-sm text-muted-foreground">
                        {track?.description}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        {filteredModules.length} {filteredModules.length === 1 ? 'module' : 'modules'}
                      </Badge>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modules Grid */}
      <div className="space-y-4">
        {filteredModules.map(module => (
          <LearningModuleCard 
            key={module.id} 
            module={module}
            initialExpanded={urlModuleId === module.id}
            highlightStepId={urlModuleId === module.id ? urlStepId : null}
          />
        ))}
      </div>

      {/* Reset Progress Link */}
      <div className="text-center pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={resetProgress}
          className="text-muted-foreground gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset learning progress
        </Button>
      </div>
    </div>
  );
}
