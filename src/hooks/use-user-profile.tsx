import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface UserProfile {
  full_name: string;
  date_of_birth: string;
  lunar_date_of_birth?: string;
  time_of_birth?: string;
  gender?: string;
  place_of_birth: string;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        // Try to get from database first
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, date_of_birth, time_of_birth, gender, place_of_birth')
          .eq('user_id', user.id)
          .single();

        if (data && !error) {
          setProfile(data);
          
          // Also save to localStorage for offline access
          localStorage.setItem('userProfile', JSON.stringify(data));
        } else {
          // If no database record, try localStorage
          const storedProfile = localStorage.getItem('userProfile');
          if (storedProfile) {
            try {
              const parsedProfile = JSON.parse(storedProfile);
              setProfile(parsedProfile);
            } catch (e) {
              console.error('Error parsing stored profile:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        
        // Fallback to localStorage
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
          try {
            const parsedProfile = JSON.parse(storedProfile);
            setProfile(parsedProfile);
          } catch (e) {
            console.error('Error parsing stored profile:', e);
          }
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  const saveProfile = async (profileData: UserProfile) => {
    if (!user) return;

    try {
      // Save to database
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: profileData.full_name,
          date_of_birth: profileData.date_of_birth,
          lunar_date_of_birth: profileData.lunar_date_of_birth || profileData.date_of_birth,
          time_of_birth: profileData.time_of_birth,
          place_of_birth: profileData.place_of_birth,
          gender: profileData.gender,
        });

      if (error) {
        console.error('Error saving profile to database:', error);
      } else {
        // Also save to localStorage
        localStorage.setItem('userProfile', JSON.stringify(profileData));
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      // Still save to localStorage as fallback
      localStorage.setItem('userProfile', JSON.stringify(profileData));
      setProfile(profileData);
    }
  };

  return { profile, loading, saveProfile };
}
