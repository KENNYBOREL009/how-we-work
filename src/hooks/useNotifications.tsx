import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'alert' | 'bus_approach' | 'trip_update';
  is_read: boolean;
  data: Record<string, any> | null;
  created_at: string;
}

export interface FavoriteStop {
  id: string;
  stop_id: string;
  notify_on_approach: boolean;
  notify_radius_meters: number;
  stop?: {
    name: string;
    address: string | null;
  };
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [favoriteStops, setFavoriteStops] = useState<FavoriteStop[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
    } else {
      setNotifications((data || []) as Notification[]);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    }
    setIsLoading(false);
  }, [user]);

  const fetchFavoriteStops = useCallback(async () => {
    if (!user) {
      setFavoriteStops([]);
      return;
    }

    const { data, error } = await supabase
      .from('favorite_stops')
      .select(`
        id,
        stop_id,
        notify_on_approach,
        notify_radius_meters,
        bus_stops (
          name,
          address
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching favorite stops:', error);
    } else {
      const mappedData = (data || []).map(fs => ({
        id: fs.id,
        stop_id: fs.stop_id,
        notify_on_approach: fs.notify_on_approach,
        notify_radius_meters: fs.notify_radius_meters,
        stop: fs.bus_stops as { name: string; address: string | null } | undefined,
      }));
      setFavoriteStops(mappedData);
    }
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  const addFavoriteStop = async (stopId: string) => {
    if (!user) {
      toast.error('Connectez-vous pour ajouter des favoris');
      return false;
    }

    const { error } = await supabase.from('favorite_stops').insert({
      user_id: user.id,
      stop_id: stopId,
      notify_on_approach: true,
      notify_radius_meters: 500,
    });

    if (error) {
      if (error.code === '23505') {
        toast.info('Cet arrêt est déjà dans vos favoris');
      } else {
        toast.error('Erreur lors de l\'ajout');
      }
      return false;
    }

    toast.success('Arrêt ajouté aux favoris');
    fetchFavoriteStops();
    return true;
  };

  const removeFavoriteStop = async (favoriteId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('favorite_stops')
      .delete()
      .eq('id', favoriteId)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Erreur lors de la suppression');
      return false;
    }

    toast.success('Arrêt retiré des favoris');
    setFavoriteStops(prev => prev.filter(fs => fs.id !== favoriteId));
    return true;
  };

  const toggleNotification = async (favoriteId: string, enabled: boolean) => {
    if (!user) return;

    const { error } = await supabase
      .from('favorite_stops')
      .update({ notify_on_approach: enabled })
      .eq('id', favoriteId)
      .eq('user_id', user.id);

    if (!error) {
      setFavoriteStops(prev =>
        prev.map(fs =>
          fs.id === favoriteId ? { ...fs, notify_on_approach: enabled } : fs
        )
      );
      toast.success(enabled ? 'Notifications activées' : 'Notifications désactivées');
    }
  };

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast for new notification
          toast.info(newNotification.title, {
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    fetchFavoriteStops();
  }, [fetchNotifications, fetchFavoriteStops]);

  return {
    notifications,
    favoriteStops,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    addFavoriteStop,
    removeFavoriteStop,
    toggleNotification,
    refetch: fetchNotifications,
  };
};
