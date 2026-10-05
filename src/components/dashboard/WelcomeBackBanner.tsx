import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pickSuggestion } from '@/constants/appMap';
import { useAppMapCounts } from '@/hooks/useAppMapCounts';
import { useActiveSubscription } from '@/hooks/useActiveSubscription';

const KEY = 'nuacha_welcome_back_dismissed';
const today = () => new Date().toISOString().slice(0, 10);

export function WelcomeBackBanner() {
  const navigate = useNavigate();
  const counts = useAppMapCounts();
  const { hasActiveSubscription } = useActiveSubscription();
  const [hidden, setHidden] = useState(() => localStorage.getItem(KEY) === today());

  if (hidden || !counts) return null;
  const suggestion = pickSuggestion(counts);

  const dismiss = () => { localStorage.setItem(KEY, today()); setHidden(true); };

  return (
    <div className="relative rounded-2xl border border-primary/20 bg-accent/50 p-4 mb-4">
      <button aria-label="Close" onClick={dismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <Sun className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="font-medium">
            {hasActiveSubscription ? 'Welcome back — lovely to see you.' : 'Welcome back — your 3 fresh scans are ready.'}
          </p>
          {suggestion && (
            <p className="text-sm text-muted-foreground">
              Something to try today: <span className="text-foreground">{suggestion.title}</span>. {suggestion.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {suggestion && <Button size="sm" onClick={() => navigate(suggestion.route)}>Show me</Button>}
            <Button size="sm" variant="outline" onClick={() => document.getElementById('nuacha-map')?.scrollIntoView({ behavior: 'smooth' })}>
              See everything Nuacha can do
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
