import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReleaseNote } from '@/types/updates';
import { Sparkles, Wrench, Bug, BookOpen, Eye } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORY_CONFIG = {
  feature: { icon: Sparkles, label: 'New Feature', color: 'bg-green-100 text-green-800' },
  improvement: { icon: Wrench, label: 'Improvement', color: 'bg-blue-100 text-blue-800' },
  bugfix: { icon: Bug, label: 'Bug Fix', color: 'bg-red-100 text-red-800' },
  'how-to': { icon: BookOpen, label: 'How To', color: 'bg-purple-100 text-purple-800' },
  showcase: { icon: Eye, label: 'Showcase', color: 'bg-yellow-100 text-yellow-800' },
};

interface ReleaseNoteCardProps {
  note: ReleaseNote;
}

export function ReleaseNoteCard({ note }: ReleaseNoteCardProps) {
  const config = CATEGORY_CONFIG[note.category];
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={config.color}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
              {note.feature_area && (
                <Badge variant="outline">{note.feature_area}</Badge>
              )}
            </div>
            <CardTitle>{note.title}</CardTitle>
            <CardDescription>
              {format(new Date(note.released_at), 'MMMM d, yyyy')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <p className="text-foreground">{note.description}</p>
        </div>
        {note.media_url && (
          <div className="mt-4">
            <img
              src={note.media_url}
              alt={note.title}
              className="rounded-lg border w-full"
            />
          </div>
        )}
        {note.tutorial_steps && note.tutorial_steps.length > 0 && (
          <div className="mt-4 space-y-3">
            {note.tutorial_steps.map((step, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {step.step}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
