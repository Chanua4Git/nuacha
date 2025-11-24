import { EmojiOption } from '@/types/updates';

export const EMOJI_OPTIONS: EmojiOption[] = [
  { emoji: '😊', label: 'Great experience', sentiment: 'positive' },
  { emoji: '🔥', label: 'Amazing!', sentiment: 'positive' },
  { emoji: '💯', label: 'Perfect!', sentiment: 'positive' },
  { emoji: '👍', label: 'Good', sentiment: 'positive' },
  { emoji: '😐', label: "It's okay", sentiment: 'neutral' },
  { emoji: '🤔', label: 'Needs work', sentiment: 'neutral' },
  { emoji: '👎', label: 'Not great', sentiment: 'negative' },
  { emoji: '🐛', label: 'Found a bug', sentiment: 'negative' },
];

export function getEmojiSentiment(emoji: string): 'positive' | 'neutral' | 'negative' {
  const option = EMOJI_OPTIONS.find(opt => opt.emoji === emoji);
  return option?.sentiment || 'neutral';
}
