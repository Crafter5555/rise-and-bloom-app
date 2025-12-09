import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  entry_type: 'morning' | 'evening';
  sleep_quality?: number;
  sleep_hours?: number;
  morning_energy?: number;
  morning_mood?: number;
  main_focus?: string;
  top_priorities?: string[];
  overall_mood?: number;
  evening_energy?: number;
  day_success_rating?: number;
  completed_goals?: string[];
  gratitude_items?: string[];
  tomorrow_focus?: string;
  reflection_notes?: string;
  created_at: string;
  updated_at: string;
}

export const useJournal = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchEntries();
    } else {
      setEntries([]);
      setLoading(false);
    }
  }, [user]);

  const fetchEntries = async (limit?: number) => {
    try {
      setLoading(true);
      let query = (supabase as any)
        .from('journal_entries')
        .select('*')
        .eq('user_id', user!.id)
        .order('entry_date', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries((data || []) as JournalEntry[]);
    } catch (err: any) {
      console.error('Error fetching journal entries:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateEntry = async (
    entryType: 'morning' | 'evening',
    entryDate: string,
    entryData: Partial<JournalEntry>
  ) => {
    try {
      const { data, error } = await (supabase as any)
        .from('journal_entries')
        .upsert({
          user_id: user!.id,
          entry_date: entryDate,
          entry_type: entryType,
          ...entryData,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,entry_date,entry_type'
        })
        .select()
        .single();

      if (error) throw error;

      await fetchEntries();

      return { data, error: null };
    } catch (err: any) {
      console.error('Error saving journal entry:', err);
      return { data: null, error: err.message };
    }
  };

  const getEntry = async (entryDate: string, entryType: 'morning' | 'evening') => {
    try {
      const { data, error } = await (supabase as any)
        .from('journal_entries')
        .select('*')
        .eq('user_id', user!.id)
        .eq('entry_date', entryDate)
        .eq('entry_type', entryType)
        .maybeSingle();

      if (error) throw error;
      return { data: data as JournalEntry | null, error: null };
    } catch (err: any) {
      console.error('Error fetching journal entry:', err);
      return { data: null, error: err.message };
    }
  };

  const getTodayEntry = async (entryType: 'morning' | 'evening') => {
    const today = new Date().toISOString().split('T')[0];
    return getEntry(today, entryType);
  };

  const hasCompletedToday = async (entryType: 'morning' | 'evening'): Promise<boolean> => {
    const { data } = await getTodayEntry(entryType);
    return !!data;
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('journal_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id);

      if (error) throw error;

      await fetchEntries();

      return { error: null };
    } catch (err: any) {
      console.error('Error deleting journal entry:', err);
      return { error: err.message };
    }
  };

  const getRecentEntries = async (days: number = 7) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data, error } = await (supabase as any)
        .from('journal_entries')
        .select('*')
        .eq('user_id', user!.id)
        .gte('entry_date', startDateStr)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      return { data: (data || []) as JournalEntry[], error: null };
    } catch (err: any) {
      console.error('Error fetching recent entries:', err);
      return { data: [], error: err.message };
    }
  };

  const getStreak = async (): Promise<number> => {
    try {
      const { data, error } = await (supabase as any)
        .from('journal_entries')
        .select('entry_date')
        .eq('user_id', user!.id)
        .order('entry_date', { ascending: false })
        .limit(90);

      if (error) throw error;
      if (!data || data.length === 0) return 0;

      const uniqueDates = [...new Set((data as { entry_date: string }[]).map(e => e.entry_date))];
      uniqueDates.sort().reverse();

      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < uniqueDates.length; i++) {
        const entryDate = new Date(uniqueDates[i]);
        entryDate.setHours(0, 0, 0, 0);

        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        expectedDate.setHours(0, 0, 0, 0);

        if (entryDate.getTime() === expectedDate.getTime()) {
          streak++;
        } else {
          break;
        }
      }

      return streak;
    } catch (err) {
      console.error('Error calculating streak:', err);
      return 0;
    }
  };

  return {
    entries,
    loading,
    error,
    createOrUpdateEntry,
    getEntry,
    getTodayEntry,
    hasCompletedToday,
    deleteEntry,
    getRecentEntries,
    getStreak,
    refetch: fetchEntries,
  };
};
