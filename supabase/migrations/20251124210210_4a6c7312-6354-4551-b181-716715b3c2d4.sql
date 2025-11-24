-- Create user_feedback table for comprehensive feedback collection
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug_report', 'feature_request', 'general', 'testimonial', 'challenge')),
  category TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  emoji_rating TEXT,
  contact_info JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'responded', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  admin_response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sentiment_score NUMERIC,
  sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
  keywords TEXT[],
  urgency_score INTEGER DEFAULT 5 CHECK (urgency_score >= 1 AND urgency_score <= 10)
);

-- Create indexes for user_feedback
CREATE INDEX idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX idx_user_feedback_status ON user_feedback(status);
CREATE INDEX idx_user_feedback_created_at ON user_feedback(created_at DESC);
CREATE INDEX idx_user_feedback_feedback_type ON user_feedback(feedback_type);

-- Enable RLS on user_feedback
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can submit feedback (public insert)
CREATE POLICY "Anyone can submit feedback" ON user_feedback
  FOR INSERT WITH CHECK (true);

-- Authenticated users can view all feedback
CREATE POLICY "Authenticated users can view all feedback" ON user_feedback
  FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can update feedback (for admin responses)
CREATE POLICY "Authenticated users can update feedback" ON user_feedback
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create release_notes table for content management
CREATE TABLE release_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('feature', 'improvement', 'bugfix', 'how-to', 'showcase')),
  feature_area TEXT CHECK (feature_area IN ('expense', 'budget', 'payroll', 'receipts', 'reports', 'families', 'general')),
  media_url TEXT,
  tutorial_steps JSONB,
  released_at DATE NOT NULL DEFAULT CURRENT_DATE,
  is_published BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for release_notes
CREATE INDEX idx_release_notes_released_at ON release_notes(released_at DESC);
CREATE INDEX idx_release_notes_category ON release_notes(category);
CREATE INDEX idx_release_notes_is_published ON release_notes(is_published);

-- Enable RLS on release_notes
ALTER TABLE release_notes ENABLE ROW LEVEL SECURITY;

-- Anyone can view published release notes
CREATE POLICY "Anyone can view published release notes" ON release_notes
  FOR SELECT USING (is_published = true OR auth.role() = 'authenticated');

-- Authenticated users can insert/update/delete release notes
CREATE POLICY "Authenticated users can manage release notes" ON release_notes
  FOR ALL USING (auth.role() = 'authenticated');

-- Create updated_at trigger for user_feedback
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_feedback_updated_at
  BEFORE UPDATE ON user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_release_notes_updated_at
  BEFORE UPDATE ON release_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();