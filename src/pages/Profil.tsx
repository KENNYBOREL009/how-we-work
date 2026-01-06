import { useState, useEffect } from "react";
import MobileLayout from "@/components/layout/MobileLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useBusMode } from "@/hooks/useBusMode";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  User,
  LogOut,
  Edit2,
  Phone,
  Mail,
  Bus,
  Shield,
  ChevronRight,
  Loader2,
  Save,
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
  const { user, loading: authLoading, signOut } = useAuth();
  const { isBusModeEnabled, toggleBusMode } = useBusMode();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
    } else if (data) {
      setProfile(data);
      setFirstName(data.first_name || "");
      setLastName(data.last_name || "");
      setPhoneNumber(data.phone_number || "");
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

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
    navigate("/auth");
  };

  if (!authLoading && !user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <div className="w-20 h-20 rounded-full gradient-lokebo flex items-center justify-center mb-6 shadow-lg">
            <User className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Profil</h1>
          <p className="text-muted-foreground text-center mb-6">
            Connectez-vous pour gérer votre profil.
          </p>
          <Button onClick={() => navigate("/auth")} className="rounded-xl">
            Se connecter
          </Button>
        </div>
      </MobileLayout>
    );
  }

  if (authLoading || loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  const initials = `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase() || "U";

  return (
    <MobileLayout>
      <header className="safe-top px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-primary">Mon</span>
          <span className="text-foreground"> Profil</span>
        </h1>
      </header>

      {/* Avatar & Name */}
      <div className="flex flex-col items-center py-6">
        <Avatar className="w-24 h-24 mb-4 border-4 border-primary">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-bold">
          {firstName || lastName ? `${firstName} ${lastName}`.trim() : "Utilisateur"}
        </h2>
        <p className="text-sm text-muted-foreground">{user?.email || phoneNumber}</p>
      </div>

      {/* Profile Form */}
      <div className="px-4 space-y-4">
        {editing ? (
          <div className="space-y-4 p-4 rounded-xl bg-muted/50 border border-border">
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
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditing(false)}
              >
                Annuler
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Enregistrer
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full justify-between h-14 rounded-xl"
            onClick={() => setEditing(true)}
          >
            <span className="flex items-center gap-3">
              <Edit2 className="w-5 h-5" />
              Modifier le profil
            </span>
            <ChevronRight className="w-5 h-5" />
          </Button>
        )}

        {/* Settings */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground px-1">Paramètres</h3>

          {/* Bus Mode Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
            <span className="flex items-center gap-3">
              <Bus className="w-5 h-5 text-lokebo-dark" />
              Mode Bus
            </span>
            <Switch checked={isBusModeEnabled} onCheckedChange={toggleBusMode} />
          </div>

          {/* Contact Info */}
          <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">{user?.email || "Non renseigné"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">{phoneNumber || "Non renseigné"}</span>
            </div>
          </div>

          {/* Security */}
          <Button
            variant="outline"
            className="w-full justify-between h-14 rounded-xl"
          >
            <span className="flex items-center gap-3">
              <Shield className="w-5 h-5" />
              Sécurité & Confidentialité
            </span>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Sign Out */}
        <Button
          variant="destructive"
          className="w-full h-14 rounded-xl mt-6"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Se déconnecter
        </Button>
      </div>
    </MobileLayout>
  );
};

export default Profil;
