import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bug, Lightbulb, MessageSquare, Star, AlertCircle } from 'lucide-react';
import { EmojiRatingWidget } from './EmojiRatingWidget';
import { useFeedback } from '@/hooks/useFeedback';
import { EMOJI_OPTIONS } from '@/constants/emojiRatings';

const FEEDBACK_TYPES = [
  { type: 'bug_report' as const, icon: Bug, label: 'Bug Report', color: 'text-red-500' },
  { type: 'feature_request' as const, icon: Lightbulb, label: 'Feature Request', color: 'text-yellow-500' },
  { type: 'general' as const, icon: MessageSquare, label: 'General Feedback', color: 'text-blue-500' },
  { type: 'testimonial' as const, icon: Star, label: 'Share Success Story', color: 'text-green-500' },
  { type: 'challenge' as const, icon: AlertCircle, label: 'Something Confusing', color: 'text-orange-500' },
];

export function UnifiedFeedbackForm() {
  const { submitFeedback, isSubmitting } = useFeedback();
  const [feedbackType, setFeedbackType] = useState<typeof FEEDBACK_TYPES[number]['type'] | ''>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [emoji, setEmoji] = useState('');
  const [rating, setRating] = useState(0);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '' });
  const [submitted, setSubmitted] = useState(false);

  const showEmojiRating = feedbackType === 'general' || feedbackType === 'testimonial';
  const showStarRating = feedbackType === 'testimonial';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackType || !subject.trim() || !message.trim()) return;

    const result = await submitFeedback({
      feedback_type: feedbackType,
      subject: subject.trim(),
      message: message.trim(),
      emoji_rating: emoji || undefined,
      rating: rating || undefined,
      contact_info: anonymous ? undefined : contactInfo
    });

    if (result.success) {
      setSubmitted(true);
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setFeedbackType('');
        setSubject('');
        setMessage('');
        setEmoji('');
        setRating(0);
        setContactInfo({ name: '', email: '', phone: '' });
      }, 3000);
    }
  };

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="text-6xl mb-4">{emoji || '💚'}</div>
          <h3 className="text-2xl font-semibold mb-2">Thank you for your feedback!</h3>
          <p className="text-muted-foreground">Your voice matters and helps us grow.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>We're here to help 💚</CardTitle>
        <CardDescription>Tell us how we can do better</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback Type Selection */}
          {!feedbackType && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEEDBACK_TYPES.map(({ type, icon: Icon, label, color }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFeedbackType(type)}
                  className="flex items-center gap-3 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-colors text-left"
                >
                  <Icon className={`w-5 h-5 ${color}`} />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          )}

          {feedbackType && (
            <>
               <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const typeConfig = FEEDBACK_TYPES.find(t => t.type === feedbackType);
                    if (typeConfig) {
                      const Icon = typeConfig.icon;
                      return <Icon className="w-5 h-5" />;
                    }
                    return null;
                  })()}
                  <span className="font-medium">
                    {FEEDBACK_TYPES.find(t => t.type === feedbackType)?.label}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFeedbackType('')}
                >
                  Change
                </Button>
              </div>

              {/* Emoji Rating */}
              {showEmojiRating && (
                <div className="space-y-3">
                  <Label>How was your experience?</Label>
                  <EmojiRatingWidget
                    onSelect={setEmoji}
                    selectedEmoji={emoji}
                    disabled={isSubmitting}
                  />
                  {emoji && (
                    <p className="text-sm text-center text-muted-foreground">
                      {EMOJI_OPTIONS.find(opt => opt.emoji === emoji)?.label}
                    </p>
                  )}
                </div>
              )}

              {/* Star Rating */}
              {showStarRating && (
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="text-2xl transition-all hover:scale-110"
                      >
                        {star <= rating ? '⭐' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary..."
                  maxLength={100}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  {feedbackType === 'bug_report' && "What happened? *"}
                  {feedbackType === 'feature_request' && "What would help? *"}
                  {feedbackType === 'testimonial' && "Share your story *"}
                  {feedbackType === 'challenge' && "What's confusing? *"}
                  {feedbackType === 'general' && "Your feedback *"}
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us more..."
                  rows={5}
                  maxLength={500}
                  required
                  disabled={isSubmitting}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {message.length}/500
                </p>
              </div>

              {/* Contact Info Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="anonymous">Submit anonymously</Label>
                <Switch
                  id="anonymous"
                  checked={anonymous}
                  onCheckedChange={setAnonymous}
                  disabled={isSubmitting}
                />
              </div>

              {!anonymous && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowContactInfo(!showContactInfo)}
                  className="w-full"
                >
                  {showContactInfo ? "Hide" : "Add"} contact info (optional)
                </Button>
              )}

              {!anonymous && showContactInfo && (
                <div className="space-y-3 border rounded-lg p-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={contactInfo.name}
                      onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !subject.trim() || !message.trim()}
              >
                {isSubmitting ? 'Sending...' : 'Submit Feedback'}
              </Button>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
