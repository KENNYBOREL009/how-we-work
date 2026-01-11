import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, Send, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { useRideMessages } from "@/hooks/useRideMessages";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface RideChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideId: string;
  otherPartyName: string;
  otherPartyPhone?: string;
  isDriver?: boolean;
}

export const RideChatDrawer = ({
  open,
  onOpenChange,
  rideId,
  otherPartyName,
  otherPartyPhone,
  isDriver = false
}: RideChatDrawerProps) => {
  const { user } = useAuth();
  const { messages, loading, sendMessage, markAsRead } = useRideMessages(rideId);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mark messages as read when opening
  useEffect(() => {
    if (open) {
      markAsRead();
    }
  }, [open, markAsRead]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const success = await sendMessage(newMessage, isDriver ? 'driver' : 'client');
    if (success) {
      setNewMessage("");
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCall = () => {
    if (otherPartyPhone) {
      window.location.href = `tel:${otherPartyPhone}`;
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[85vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {otherPartyName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <DrawerTitle>{otherPartyName}</DrawerTitle>
                <p className="text-xs text-muted-foreground">
                  {isDriver ? 'Client' : 'Chauffeur'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {otherPartyPhone && (
                <Button variant="outline" size="icon" onClick={handleCall}>
                  <Phone className="w-4 h-4" />
                </Button>
              )}
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="w-4 h-4" />
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerHeader>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucun message</p>
              <p className="text-xs mt-1">Envoyez un message pour communiquer</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    isOwn ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] px-4 py-2 rounded-2xl",
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-bl-sm"
                    )}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className={cn(
                      "text-xs mt-1",
                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-background">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Écrire un message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
              className="flex-1"
            />
            <Button 
              onClick={handleSend} 
              disabled={!newMessage.trim() || sending}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
