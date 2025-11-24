import { useState } from 'react';
import { EMOJI_OPTIONS } from '@/constants/emojiRatings';

interface EmojiRatingWidgetProps {
  onSelect: (emoji: string) => void;
  selectedEmoji?: string;
  disabled?: boolean;
}

export function EmojiRatingWidget({ onSelect, selectedEmoji, disabled }: EmojiRatingWidgetProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {EMOJI_OPTIONS.map(({ emoji, label }) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          disabled={disabled}
          className={`
            text-3xl p-3 rounded-full transition-all hover:scale-110
            ${selectedEmoji === emoji 
              ? 'bg-primary/10 ring-2 ring-primary scale-110' 
              : 'hover:bg-accent'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          title={label}
          type="button"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
