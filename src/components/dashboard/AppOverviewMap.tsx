import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Sparkles, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { APP_MAP, AppMapItem, allMapItems, learnLink } from '@/constants/appMap';
import { useAppMapCounts } from '@/hooks/useAppMapCounts';
import { useActiveSubscription } from '@/hooks/useActiveSubscription';
import { NUACHA_INTRO_OFFER } from '@/constants/nuachaPayment';

export function AppOverviewMap() {
  const navigate = useNavigate();
  const counts = useAppMapCounts();
  const { hasActiveSubscription } = useActiveSubscription();
  const [trialItem, setTrialItem] = useState<AppMapItem | null>(null);

  const items = allMapItems();
  const doneCount = counts ? items.filter(i => i.isDone?.(counts)).length : 0;

  const handleItem = (item: AppMapItem) => {
    if (item.requiresSubscription && !hasActiveSubscription) setTrialItem(item);
    else navigate(item.route);
  };

  return (
    <div id="nuacha-map" className="p-4 rounded-lg bg-background border border-border scroll-mt-20">
      <div className="mb-4 space-y-2">
        <h3 className="font-playfair text-xl text-primary">Your Nuacha map</h3>
        <p className="text-sm text-muted-foreground">Everything Nuacha can do, in one place. Explore at your own pace.</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>You've explored {doneCount} of {items.length} things Nuacha can do</span>
        </div>
        <Progress value={(doneCount / items.length) * 100} className="h-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {APP_MAP.map(area => {
          const Icon = area.icon;
          return (
            <div key={area.id} className="rounded-2xl border border-border bg-muted/20 p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-full bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
                <h4 className="font-medium">{area.title}</h4>
              </div>
              <ul className="space-y-1 flex-1">
                {area.items.map(item => {
                  const done = !!(counts && item.isDone?.(counts));
                  const locked = item.requiresSubscription && !hasActiveSubscription;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleItem(item)}
                        className="w-full text-left flex items-start gap-2 rounded-lg px-2 py-2 hover:bg-background transition-colors"
                      >
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm">{item.title}</span>
                          <span className="block text-xs text-muted-foreground">{item.description}</span>
                        </span>
                        {done ? (
                          <span className="shrink-0 flex items-center gap-1 text-xs text-primary"><CheckCircle2 className="h-4 w-4" />Done</span>
                        ) : locked ? (
                          <span className="shrink-0 text-xs rounded-full bg-accent px-2 py-0.5 text-foreground">In the trial</span>
                        ) : (
                          <span className="shrink-0 flex items-center text-xs text-primary">Try it<ArrowRight className="h-3 w-3 ml-1" /></span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Button variant="ghost" size="sm" className="mt-2 self-start text-muted-foreground" onClick={() => navigate(learnLink(area.learnModule))}>
                <GraduationCap className="h-4 w-4 mr-1" /> Learn this
              </Button>
            </div>
          );
        })}
      </div>

      <Dialog open={!!trialItem} onOpenChange={o => !o && setTrialItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-playfair text-2xl">{trialItem?.title}</DialogTitle>
            <DialogDescription className="pt-2">{trialItem?.description}</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-sm">
            <div className="flex items-center gap-2 font-medium text-primary mb-1"><Sparkles className="h-4 w-4" />Included in the trial</div>
            TT${NUACHA_INTRO_OFFER.priceTTD}/month for your first {NUACHA_INTRO_OFFER.months} months{' '}
            <span className="text-muted-foreground">(usually <span className="line-through">TT$149</span>)</span>, with unlimited scans too.
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setTrialItem(null)}>Maybe later</Button>
            <Button onClick={() => { setTrialItem(null); navigate('/get-started'); }}>See the trial</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
