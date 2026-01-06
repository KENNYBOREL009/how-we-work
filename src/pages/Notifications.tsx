import { useState } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useNotifications } from "@/hooks/useNotifications";
import { useVehicles } from "@/hooks/useVehicles";
import { 
  Bell, 
  BellOff,
  Check,
  CheckCheck,
  MapPin,
  Bus,
  AlertCircle,
  Clock,
  Star,
  StarOff,
  Loader2,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const notificationIcons: Record<string, typeof Bell> = {
  info: Bell,
  alert: AlertCircle,
  bus_approach: Bus,
  trip_update: Clock,
};

const Notifications = () => {
  const [activeTab, setActiveTab] = useState<"notifications" | "favorites">("notifications");
  const { 
    notifications, 
    favoriteStops,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    removeFavoriteStop,
    toggleNotification
  } = useNotifications();
  const { busStops } = useVehicles();

  return (
    <MobileLayout>
      {/* Header */}
      <header className="safe-top px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-lokebo-dark flex items-center justify-center relative">
              <Bell className="w-6 h-6 text-primary" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                Alertes et arrêts favoris
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Tout lire
            </Button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className="flex-1 flex flex-col px-4"
      >
        <TabsList className="grid grid-cols-2 mb-3">
          <TabsTrigger value="notifications" className="flex items-center gap-1.5">
            <Bell className="w-4 h-4" />
            Alertes
            {unreadCount > 0 && (
              <span className="ml-1 w-5 h-5 bg-destructive text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-1.5">
            <Star className="w-4 h-4" />
            Favoris
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="flex-1 mt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <BellOff className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Aucune notification</h3>
              <p className="text-sm text-muted-foreground">
                Vos alertes apparaîtront ici
              </p>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="space-y-2 pb-4">
                {notifications.map((notification) => {
                  const Icon = notificationIcons[notification.type] || Bell;
                  
                  return (
                    <button
                      key={notification.id}
                      onClick={() => !notification.is_read && markAsRead(notification.id)}
                      className={cn(
                        "w-full p-4 rounded-xl border text-left transition-colors",
                        notification.is_read
                          ? "bg-card border-border"
                          : "bg-accent border-primary/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                          notification.type === "bus_approach" 
                            ? "bg-lokebo-success text-white"
                            : notification.type === "alert"
                            ? "bg-destructive text-white"
                            : "bg-primary text-primary-foreground"
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={cn(
                              "font-semibold text-sm",
                              notification.is_read ? "text-foreground" : "text-foreground"
                            )}>
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(notification.created_at), "d MMM à HH:mm", { locale: fr })}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Favorites Tab */}
        <TabsContent value="favorites" className="flex-1 mt-0">
          {favoriteStops.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <StarOff className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Aucun arrêt favori</h3>
              <p className="text-sm text-muted-foreground max-w-[200px]">
                Ajoutez des arrêts favoris pour recevoir des alertes quand un bus approche
              </p>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="space-y-3 pb-4">
                {favoriteStops.map((favorite) => (
                  <div
                    key={favorite.id}
                    className="p-4 rounded-xl border border-border bg-card"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm mb-1">
                          {favorite.stop?.name || "Arrêt inconnu"}
                        </h3>
                        {favorite.stop?.address && (
                          <p className="text-xs text-muted-foreground mb-3">
                            {favorite.stop.address}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Alertes
                            </span>
                            <Switch
                              checked={favorite.notify_on_approach}
                              onCheckedChange={(checked) => 
                                toggleNotification(favorite.id, checked)
                              }
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeFavoriteStop(favorite.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Add Favorite CTA */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-2">
              Ajoutez des arrêts depuis la carte Bus
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </MobileLayout>
  );
};

export default Notifications;
