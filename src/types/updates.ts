export interface UserFeedback {
  id: string;
  user_id: string | null;
  feedback_type: 'bug_report' | 'feature_request' | 'general' | 'testimonial' | 'challenge';
  category: string | null;
  subject: string;
  message: string;
  rating: number | null;
  emoji_rating: string | null;
  contact_info: {
    name?: string;
    email?: string;
    phone?: string;
  };
  metadata: {
    page?: string;
    userAgent?: string;
    screenshots?: string[];
    [key: string]: any;
  };
  status: 'new' | 'reviewed' | 'responded' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  sentiment_score: number | null;
  sentiment_label: 'positive' | 'neutral' | 'negative' | null;
  keywords: string[] | null;
  urgency_score: number;
}

export interface ReleaseNote {
  id: string;
  title: string;
  description: string;
  category: 'feature' | 'improvement' | 'bugfix' | 'how-to' | 'showcase';
  feature_area: 'expense' | 'budget' | 'payroll' | 'receipts' | 'reports' | 'families' | 'general' | null;
  media_url: string | null;
  tutorial_steps: TutorialStep[] | null;
  released_at: string;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TutorialStep {
  step: number;
  title: string;
  description: string;
  imageUrl?: string;
}

export interface EmojiOption {
  emoji: string;
  label: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface FeedbackStats {
  total: number;
  new: number;
  avgSentiment: number;
  responseRate: number;
}
