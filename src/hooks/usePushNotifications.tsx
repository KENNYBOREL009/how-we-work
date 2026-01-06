import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, any>;
  timestamp: Date;
}

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [notifications, setNotifications] = useState<PushNotification[]>([]);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error("Les notifications ne sont pas supportées sur ce navigateur");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success("Notifications activées !");
        return true;
      } else if (result === 'denied') {
        toast.error("Notifications refusées. Activez-les dans les paramètres du navigateur.");
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback((
    title: string,
    options?: {
      body?: string;
      icon?: string;
      data?: Record<string, any>;
      onClick?: () => void;
    }
  ) => {
    // Always create internal notification record
    const notif: PushNotification = {
      id: crypto.randomUUID(),
      title,
      body: options?.body || '',
      icon: options?.icon,
      data: options?.data,
      timestamp: new Date()
    };
    setNotifications(prev => [notif, ...prev.slice(0, 49)]);

    // Show toast notification
    toast.info(title, {
      description: options?.body,
    });

    // If permission granted, show native notification
    if (permission === 'granted' && isSupported) {
      const notification = new Notification(title, {
        body: options?.body,
        icon: options?.icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: notif.id,
        data: options?.data,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        options?.onClick?.();
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }
  }, [permission, isSupported]);

  // Pre-built notification types for the app
  const notifyDriverArriving = useCallback((driverName: string, eta: number) => {
    sendNotification("🚗 Chauffeur en approche", {
      body: `${driverName} arrive dans ${eta} minutes`,
      data: { type: 'driver_arriving', eta }
    });
  }, [sendNotification]);

  const notifyDriverArrived = useCallback((driverName: string, plateNumber: string) => {
    sendNotification("📍 Votre chauffeur est arrivé !", {
      body: `${driverName} vous attend - ${plateNumber}`,
      data: { type: 'driver_arrived', plateNumber }
    });
  }, [sendNotification]);

  const notifyTripStarted = useCallback((destination: string) => {
    sendNotification("✅ Course démarrée", {
      body: `En route vers ${destination}`,
      data: { type: 'trip_started', destination }
    });
  }, [sendNotification]);

  const notifyTripCompleted = useCallback((fare: number, destination: string) => {
    sendNotification("🎉 Vous êtes arrivé !", {
      body: `${destination} - ${fare.toLocaleString()} FCFA`,
      data: { type: 'trip_completed', fare }
    });
  }, [sendNotification]);

  const notifyScheduledTrip = useCallback((destination: string, scheduledTime: Date) => {
    const timeStr = scheduledTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    sendNotification("📅 Rappel de course programmée", {
      body: `Départ prévu à ${timeStr} vers ${destination}`,
      data: { type: 'scheduled_reminder', scheduledTime: scheduledTime.toISOString() }
    });
  }, [sendNotification]);

  const notifyPromotion = useCallback((title: string, description: string) => {
    sendNotification(`🎁 ${title}`, {
      body: description,
      data: { type: 'promotion' }
    });
  }, [sendNotification]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    permission,
    isSupported,
    notifications,
    requestPermission,
    sendNotification,
    // Pre-built notifications
    notifyDriverArriving,
    notifyDriverArrived,
    notifyTripStarted,
    notifyTripCompleted,
    notifyScheduledTrip,
    notifyPromotion,
    clearNotifications,
  };
};
