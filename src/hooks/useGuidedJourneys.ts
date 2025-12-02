import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Journey {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_days: number;
  is_premium: boolean;
  coach_led: boolean;
  thumbnail_url?: string;
  total_steps: number;
  popularity_score: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface JourneyStep {
  id: string;
  journey_id: string;
  step_number: number;
  title: string;
  description: string;
  step_type: 'lesson' | 'exercise' | 'reflection' | 'challenge';
  content_url?: string;
  content_type?: 'video' | 'audio' | 'text' | 'interactive';
  estimated_minutes: number;
  is_required: boolean;
  unlock_after_days: number;
  points_reward: number;
  created_at: string;
  updated_at: string;
}

interface JourneyEnrollment {
  id: string;
  user_id: string;
  journey_id: string;
  enrolled_at: string;
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  current_step: number;
  completed_steps: number;
  completion_percentage: number;
  last_activity_at: string;
  completed_at?: string;
  notes?: string;
}

interface JourneyProgress {
  id: string;
  enrollment_id: string;
  step_id: string;
  user_id: string;
  completed_at: string;
  time_spent_minutes: number;
  quality_rating?: number;
  notes?: string;
  points_earned: number;
}

export const useGuidedJourneys = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [enrollments, setEnrollments] = useState<JourneyEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchJourneys();
      fetchEnrollments();
    }
  }, [user]);

  const fetchJourneys = async () => {
    try {
      const { data, error } = await supabase
        .from('journeys')
        .select('*')
        .eq('is_published', true)
        .order('popularity_score', { ascending: false });

      if (error) throw error;
      setJourneys(data || []);
    } catch (error) {
      console.error('Error fetching journeys:', error);
      toast({
        title: 'Error',
        description: 'Failed to load journeys',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('journey_enrollments')
        .select('*')
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const enrollInJourney = async (journeyId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('journey_enrollments')
        .insert({
          user_id: user.id,
          journey_id: journeyId,
          status: 'active',
          current_step: 1,
          completed_steps: 0,
          completion_percentage: 0
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Enrolled Successfully',
        description: 'You have been enrolled in this journey'
      });

      await fetchEnrollments();
      return data;
    } catch (error: any) {
      console.error('Error enrolling in journey:', error);

      if (error.code === '23505') {
        toast({
          title: 'Already Enrolled',
          description: 'You are already enrolled in this journey',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to enroll in journey',
          variant: 'destructive'
        });
      }
      return null;
    }
  };

  const getJourneySteps = async (journeyId: string): Promise<JourneyStep[]> => {
    try {
      const { data, error } = await supabase
        .from('journey_steps')
        .select('*')
        .eq('journey_id', journeyId)
        .order('step_number', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching journey steps:', error);
      return [];
    }
  };

  const getEnrollmentProgress = async (enrollmentId: string): Promise<JourneyProgress[]> => {
    try {
      const { data, error } = await supabase
        .from('journey_progress')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching progress:', error);
      return [];
    }
  };

  const completeStep = async (
    enrollmentId: string,
    stepId: string,
    timeSpentMinutes: number,
    qualityRating?: number,
    notes?: string
  ) => {
    if (!user) return null;

    try {
      const step = await supabase
        .from('journey_steps')
        .select('points_reward')
        .eq('id', stepId)
        .single();

      const pointsEarned = step.data?.points_reward || 0;

      const { data, error } = await supabase
        .from('journey_progress')
        .insert({
          enrollment_id: enrollmentId,
          step_id: stepId,
          user_id: user.id,
          time_spent_minutes: timeSpentMinutes,
          quality_rating: qualityRating,
          notes: notes,
          points_earned: pointsEarned
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Step Completed',
        description: `You earned ${pointsEarned} points!`
      });

      await fetchEnrollments();
      return data;
    } catch (error: any) {
      console.error('Error completing step:', error);

      if (error.code === '23505') {
        toast({
          title: 'Already Completed',
          description: 'You have already completed this step'
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to complete step',
          variant: 'destructive'
        });
      }
      return null;
    }
  };

  const updateEnrollmentStatus = async (
    enrollmentId: string,
    status: 'active' | 'paused' | 'abandoned',
    notes?: string
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('journey_enrollments')
        .update({
          status,
          notes,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', enrollmentId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: `Journey status changed to ${status}`
      });

      await fetchEnrollments();
    } catch (error) {
      console.error('Error updating enrollment status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive'
      });
    }
  };

  const isStepUnlocked = (step: JourneyStep, enrollment: JourneyEnrollment): boolean => {
    const enrolledDate = new Date(enrollment.enrolled_at);
    const currentDate = new Date();
    const daysSinceEnrollment = Math.floor(
      (currentDate.getTime() - enrolledDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceEnrollment >= step.unlock_after_days;
  };

  const getJourneyById = (journeyId: string): Journey | undefined => {
    return journeys.find(j => j.id === journeyId);
  };

  const getEnrollmentForJourney = (journeyId: string): JourneyEnrollment | undefined => {
    return enrollments.find(e => e.journey_id === journeyId);
  };

  const isEnrolled = (journeyId: string): boolean => {
    return enrollments.some(e => e.journey_id === journeyId);
  };

  return {
    journeys,
    enrollments,
    loading,
    enrollInJourney,
    getJourneySteps,
    getEnrollmentProgress,
    completeStep,
    updateEnrollmentStatus,
    isStepUnlocked,
    getJourneyById,
    getEnrollmentForJourney,
    isEnrolled,
    refreshJourneys: fetchJourneys,
    refreshEnrollments: fetchEnrollments
  };
};
