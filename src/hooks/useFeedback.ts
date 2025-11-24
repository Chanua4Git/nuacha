import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserFeedback } from '@/types/updates';

interface SubmitFeedbackData {
  feedback_type: UserFeedback['feedback_type'];
  subject: string;
  message: string;
  category?: string;
  rating?: number;
  emoji_rating?: string;
  contact_info?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  metadata?: any;
}

export function useFeedback() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = async (data: SubmitFeedbackData) => {
    setIsSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const { error } = await supabase.from('user_feedback').insert({
        user_id: session.session?.user?.id || null,
        feedback_type: data.feedback_type,
        category: data.category || null,
        subject: data.subject,
        message: data.message,
        rating: data.rating || null,
        emoji_rating: data.emoji_rating || null,
        contact_info: data.contact_info || {},
        metadata: {
          ...data.metadata,
          page: window.location.pathname,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        },
        status: 'new',
        priority: data.feedback_type === 'bug_report' ? 'high' : 'medium'
      });

      if (error) throw error;

      toast({
        title: "Thank you for your feedback! 💚",
        description: "Your voice matters and helps us improve."
      });

      return { success: true };
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Couldn't submit feedback",
        description: "Please try again in a moment.",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitFeedback, isSubmitting };
}
