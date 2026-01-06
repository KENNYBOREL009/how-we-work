import { useState } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  BellRing, 
  Car, 
  Calendar, 
  Gift, 
  Shield, 
  MapPin,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const NotificationSettings = () => {
  const navigate = useNavigate();
  const { 
    permission, 
    isSupported, 
    requestPermission, 
    notifyPromotion 
  } = usePushNotifications();
  
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  const [settings, setSettings] = useState({
    tripUpdates: true,
    driverApproach: true,
    promotions: true,
    scheduledReminders: true,
    busAlerts: true
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTestNotification = () => {
    notifyPromotion("Test notification", "Vos notifications fonctionnent correctement !");
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trip_update':
        return <Car className="w-4 h-4" />;
      case 'bus_approach':
        return <MapPin className="w-4 h-4" />;
      case 'alert':
        return <Shield className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <MobileLayout>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="p-4 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground">{unreadCount} non lues</p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Tout lire
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Push notification permission */}
          <Card className={cn(
            "border-2",
            permission === 'granted' ? "border-green-500/50" : "border-amber-500/50"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  permission === 'granted' ? "bg-green-500/10" : "bg-amber-500/10"
                )}>
                  <BellRing className={cn(
                    "w-6 h-6",
                    permission === 'granted' ? "text-green-500" : "text-amber-500"
                  )} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Notifications Push</p>
                  <p className="text-sm text-muted-foreground">
                    {permission === 'granted' 
                      ? "Activées - vous recevez les alertes"
                      : permission === 'denied'
                      ? "Désactivées dans le navigateur"
                      : "Activez pour ne rien manquer"}
                  </p>
                </div>
                {permission !== 'granted' && (
                  <Button 
                    size="sm"
                    onClick={requestPermission}
                    disabled={!isSupported}
                  >
                    Activer
                  </Button>
                )}
              </div>
              
              {permission === 'granted' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3"
                  onClick={handleTestNotification}
                >
                  Tester les notifications
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Notification settings */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Préférences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Car className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Mises à jour de course</p>
                    <p className="text-xs text-muted-foreground">Arrivée chauffeur, fin de course</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.tripUpdates}
                  onCheckedChange={() => handleToggle('tripUpdates')}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">Approche du chauffeur</p>
                    <p className="text-xs text-muted-foreground">Notification quand il est proche</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.driverApproach}
                  onCheckedChange={() => handleToggle('driverApproach')}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Rappels programmés</p>
                    <p className="text-xs text-muted-foreground">30 min avant vos courses planifiées</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.scheduledReminders}
                  onCheckedChange={() => handleToggle('scheduledReminders')}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Gift className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="font-medium">Promotions</p>
                    <p className="text-xs text-muted-foreground">Offres et réductions</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.promotions}
                  onCheckedChange={() => handleToggle('promotions')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Recent notifications */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Récentes</CardTitle>
                {notifications.length > 0 && (
                  <Badge variant="secondary">{notifications.length}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Aucune notification</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 10).map((notif) => (
                    <div 
                      key={notif.id} 
                      className={cn(
                        "p-3 rounded-xl border cursor-pointer transition-colors",
                        notif.is_read 
                          ? "bg-background border-border" 
                          : "bg-primary/5 border-primary/20"
                      )}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          notif.is_read ? "bg-muted" : "bg-primary/10"
                        )}>
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm",
                            !notif.is_read && "font-semibold"
                          )}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {notif.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(notif.created_at), { 
                              addSuffix: true, 
                              locale: fr 
                            })}
                          </p>
                        </div>
                        {!notif.is_read && (
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
};

export default NotificationSettings;
