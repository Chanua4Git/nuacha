import { describe, expect, it } from 'vitest';
import { applyReelWords, DEMO_RECEIPTS, REEL_DEFAULTS, REEL_H, REEL_W, reelTimeline, reelWords, reelsForLesson, reelLessonPath } from './tutorialReelSpecs';
import { learningModules } from '@/constants/learningCenterData';

describe('Learning and reel alignment', () => {
  it('connects both receipt reels to the first-receipt lesson and valid steps', () => {
    expect(reelsForLesson('first-receipt-scan').map(reel => reel.slug)).toEqual(['scan-first-receipt', 'scan-receipts-two-and-three']);
    for (const reel of REEL_DEFAULTS) {
      const lesson = learningModules.find(module => module.id === reel.moduleId);
      expect(lesson).toBeDefined();
      for (const step of reel.steps.filter(step => step.lessonStepId)) {
        expect(lesson?.steps.some(item => item.id === step.lessonStepId)).toBe(true);
      }
    }
    expect(reelLessonPath(REEL_DEFAULTS[0], 'step-2-2')).toBe('/updates?tab=learning&module=first-receipt-scan&step=step-2-2');
  });
  it('does not let saved admin words change lesson mapping', () => {
    const reel = applyReelWords(REEL_DEFAULTS[0], { version: 2, moduleId: 'private-lesson', steps: [{ lessonStepId: 'wrong-step' }] });
    expect(reel.moduleId).toBe('first-receipt-scan');
    expect(reel.steps[0].lessonStepId).toBe('step-2-1');
  });
});

describe('automatic tutorial reel privacy', () => {
  it('ignores legacy uploaded receipts and user-positioned taps', () => {
    const reel = applyReelWords(REEL_DEFAULTS[0], { steps: [{ screenshot: 'private/receipt.png', tap: { x: .9, y: .2 }, caption: 'legacy' }] });
    expect(reel.steps).toEqual(REEL_DEFAULTS[0].steps);
    expect(JSON.stringify(reel)).not.toContain('private/receipt.png');
  });
  it('accepts words but cannot replace demo scenes, receipt data or count', () => {
    const reel = applyReelWords(REEL_DEFAULTS[0], { version: 2, steps: [{ caption: 'Check this receipt', scene: 'bank', receipt: 999, count: 99 }], account: 'private-account' });
    expect(reel.steps[0]).toEqual({ ...REEL_DEFAULTS[0].steps[0], caption: 'Check this receipt' });
    expect(JSON.stringify(reelWords(reel))).not.toContain('private-account');
    expect(Object.keys(reelWords(reel).steps[0])).toEqual(['caption']);
  });
  it('uses the requested sample merchant and total in a 1080 × 1920 reel', () => {
    expect(DEMO_RECEIPTS[0].merchant).toBe('Massy Stores');
    expect(JSON.stringify(DEMO_RECEIPTS)).not.toMatch(/hi-?lo/i);
    expect(DEMO_RECEIPTS[0].total).toBe('TT$214.50');
    expect([REEL_W, REEL_H]).toEqual([1080, 1920]);
  });
  it('shows both ways to add a receipt: upload from photos, then snap with the camera', () => {
    const kinds = REEL_DEFAULTS[1].steps.map(s => s.scene);
    expect(kinds.indexOf('photos')).toBeGreaterThan(-1);
    expect(kinds.indexOf('camera')).toBeGreaterThan(kinds.indexOf('photos'));
  });
  it('finishes the second reel at three scans, counted during reading before saving', () => {
    const scenes = reelTimeline(REEL_DEFAULTS[1]).scenes;
    expect(scenes.filter(s => s.step.scene === 'reading').map(s => s.step.count)).toEqual([2, 3]);
    expect(scenes[scenes.length - 1].step.count).toBe(3);
    expect(reelTimeline(REEL_DEFAULTS[1]).duration).toBeCloseTo(27.8);
  });
});