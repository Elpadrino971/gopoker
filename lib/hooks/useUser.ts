import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/authStore';
import { User } from '@/lib/types';

export function useUser() {
  const { user: authUser } = useAuthStore();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['user', authUser?.id],
    queryFn: async () => {
      if (!authUser) return null;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) throw error;

      return data;
    },
    enabled: !!authUser,
  });

  const canCreateGame = () => {
    if (!user) return false;

    // Pro and Club users can create unlimited games
    if (user.subscription_tier === 'pro' || user.subscription_tier === 'club') {
      return true;
    }

    // Free users: need to check usage tracking (implement later)
    return true; // For now, allow free users
  };

  const needsUpgrade = () => {
    return user?.subscription_tier === 'free';
  };

  return {
    user,
    isLoading,
    canCreateGame,
    needsUpgrade,
  };
}
