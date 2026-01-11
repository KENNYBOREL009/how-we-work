import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface RideMessage {
  id: string;
  ride_id: string;
  sender_id: string;
  sender_type: 'client' | 'driver';
  message: string;
  is_read: boolean;
  created_at: string;
}

export const useRideMessages = (rideId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<RideMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const markAsRead = useCallback(async () => {
    if (!rideId || !user) return;

    await (supabase as any)
      .from('ride_messages')
      .update({ is_read: true })
      .eq('ride_id', rideId)
      .neq('sender_id', user.id);

    setUnreadCount(0);
  }, [rideId, user]);

  // Fetch messages
  useEffect(() => {
    if (!rideId || !user) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('ride_messages')
        .select('*')
        .eq('ride_id', rideId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data as RideMessage[]);
        setUnreadCount(data.filter((m: RideMessage) => !m.is_read && m.sender_id !== user.id).length);
      }
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`ride-messages-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_messages',
          filter: `ride_id=eq.${rideId}`
        },
        (payload) => {
          const newMessage = payload.new as RideMessage;
          setMessages(prev => [...prev, newMessage]);
          if (newMessage.sender_id !== user.id) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId, user]);

  const sendMessage = async (message: string, senderType: 'client' | 'driver'): Promise<boolean> => {
    if (!rideId || !user || !message.trim()) return false;

    const { error } = await (supabase as any)
      .from('ride_messages')
      .insert({
        ride_id: rideId,
        sender_id: user.id,
        sender_type: senderType,
        message: message.trim()
      });

    if (error) {
      console.error('Failed to send message:', error);
      return false;
    }

    return true;
  };

  return {
    messages,
    loading,
    unreadCount,
    sendMessage,
    markAsRead
  };
};
