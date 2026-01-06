import { useState, useEffect } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import AddressManager from "@/components/profile/AddressManager";
import {
  User,
  LogOut,
  ChevronRight,
  Loader2,
  Save,
  History,
  Calendar,
  Car,
  MapPin,
  HelpCircle,
  Info,
  X,
} from "lucide-react";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
}

const Profil = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form
  const [firstName, setFirstName] = useState("Utilisateur");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
    } else if (data) {
      setProfile(data);
      setFirstName(data.first_name || "Utilisateur");
      setLastName(data.last_name || "");
      setPhoneNumber(data.phone_number || "");
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) {
      toast.info("Connectez-vous pour sauvegarder votre profil");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Erreur lors de la sauvegarde");
    } else {
      toast.success("Profil mis à jour !");
      setEditing(false);
      fetchProfile();
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Déconnexion réussie");
    navigate("/");
  };

  const initials = `${firstName?.charAt(0) || "U"}${lastName?.charAt(0) || ""}`.toUpperCase();

  return (
    <MobileLayout>
      <div className="flex-1 overflow-auto">
        {/* Profile Header */}
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl font-bold">
                {firstName || lastName ? `${firstName} ${lastName}`.trim() : "Utilisateur"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {user?.email || phoneNumber || "Mode démo"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setEditing(!editing)}
            >
              {editing ? <X className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="px-4 pb-4">
            <div className="space-y-4 p-4 rounded-xl bg-muted/50 border border-border animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSaveProfile}
                disabled={saving || !user}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Enregistrer
              </Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {/* Menu Sections */}
        <div className="px-4 space-y-6 pb-6">
          {/* Addresses */}
          {user ? (
            <AddressManager userId={user.id} />
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground px-1">Mes Adresses</h3>
              <div className="p-4 rounded-xl bg-muted/50 border border-border text-center">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Connectez-vous pour gérer vos adresses</p>
              </div>
            </div>
          )}

          {/* Activity */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground px-1">Activité</h3>
            <Button
              variant="ghost"
              className="w-full justify-between h-14 px-4 rounded-xl"
              onClick={() => navigate("/reservations")}
            >
              <span className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-amber-500" />
                Réservations programmées
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-between h-14 px-4 rounded-xl"
              onClick={() => navigate("/history")}
            >
              <span className="flex items-center gap-3">
                <History className="w-5 h-5 text-muted-foreground" />
                Historique des trajets
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>

          {/* Driver */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground px-1">Conducteur</h3>
            <Button
              variant="ghost"
              className="w-full justify-between h-14 px-4 rounded-xl"
              onClick={() => navigate("/become-driver")}
            >
              <span className="flex items-center gap-3">
                <Car className="w-5 h-5 text-primary" />
                Travailler comme chauffeur
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>

          {/* Support */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground px-1">Support</h3>
            <Button
              variant="ghost"
              className="w-full justify-between h-14 px-4 rounded-xl"
              onClick={() => navigate("/assistance")}
            >
              <span className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-muted-foreground" />
                Assistance
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-between h-14 px-4 rounded-xl"
              onClick={() => navigate("/about")}
            >
              <span className="flex items-center gap-3">
                <Info className="w-5 h-5 text-muted-foreground" />
                Informations
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>

          {/* Auth Actions */}
          <div className="pt-2">
            {user ? (
              <Button
                variant="ghost"
                className="w-full h-12 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5 mr-2" />
                Se déconnecter
              </Button>
            ) : (
              <Button
                className="w-full h-12 rounded-xl"
                onClick={() => navigate("/auth")}
              >
                <User className="w-5 h-5 mr-2" />
                Se connecter
              </Button>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Profil;
