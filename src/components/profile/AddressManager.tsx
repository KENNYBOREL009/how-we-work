import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  MapPin,
  Plus,
  Home,
  Briefcase,
  Star,
  Trash2,
  Loader2,
  ChevronRight,
} from "lucide-react";

interface UserAddress {
  id: string;
  label: string;
  address: string;
  address_type: string;
  is_default: boolean;
}

interface AddressManagerProps {
  userId: string;
}

const addressTypeIcons: Record<string, React.ReactNode> = {
  home: <Home className="w-5 h-5 text-primary" />,
  work: <Briefcase className="w-5 h-5 text-amber-500" />,
  other: <MapPin className="w-5 h-5 text-muted-foreground" />,
};

const addressTypeLabels: Record<string, string> = {
  home: "Domicile",
  work: "Travail",
  other: "Autre",
};

const AddressManager = ({ userId }: AddressManagerProps) => {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [addressType, setAddressType] = useState("other");

  useEffect(() => {
    fetchAddresses();
  }, [userId]);

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from("user_addresses" as any)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching addresses:", error);
      } else {
        setAddresses((data as unknown as UserAddress[]) || []);
      }
    } catch (err) {
      console.error("Error fetching addresses:", err);
    }
    setLoading(false);
  };

  const handleSaveAddress = async () => {
    if (!label.trim() || !address.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("user_addresses" as any).insert({
      user_id: userId,
      label: label.trim(),
      address: address.trim(),
      address_type: addressType,
    });

    if (error) {
      console.error("Error saving address:", error);
      toast.error("Erreur lors de l'enregistrement");
    } else {
      toast.success("Adresse ajoutée !");
      setLabel("");
      setAddress("");
      setAddressType("other");
      setDialogOpen(false);
      fetchAddresses();
    }
    setSaving(false);
  };

  const handleDeleteAddress = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase
      .from("user_addresses" as any)
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting address:", error);
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Adresse supprimée");
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    }
    setDeleting(null);
  };

  const handleSetDefault = async (id: string) => {
    // First, unset all defaults
    await supabase
      .from("user_addresses" as any)
      .update({ is_default: false })
      .eq("user_id", userId);

    // Then set the new default
    const { error } = await supabase
      .from("user_addresses" as any)
      .update({ is_default: true })
      .eq("id", id);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      toast.success("Adresse par défaut mise à jour");
      fetchAddresses();
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground px-1">
          Mes Adresses
        </h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm mx-4">
            <DialogHeader>
              <DialogTitle>Nouvelle adresse</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="addressType">Type</Label>
                <Select value={addressType} onValueChange={setAddressType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">
                      <span className="flex items-center gap-2">
                        <Home className="w-4 h-4" /> Domicile
                      </span>
                    </SelectItem>
                    <SelectItem value="work">
                      <span className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> Travail
                      </span>
                    </SelectItem>
                    <SelectItem value="other">
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Autre
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Nom de l'adresse</Label>
                <Input
                  id="label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ex: Maison, Bureau principal..."
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresse complète</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rue, quartier, ville..."
                  maxLength={200}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSaveAddress}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Ajouter l'adresse
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <div className="p-4 rounded-xl bg-muted/50 border border-border text-center">
          <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Aucune adresse enregistrée
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Ajoutez votre domicile ou lieu de travail
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {addressTypeIcons[addr.address_type] || addressTypeIcons.other}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{addr.label}</p>
                    {addr.is_default && (
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {addr.address}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!addr.is_default && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleSetDefault(addr.id)}
                    title="Définir par défaut"
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteAddress(addr.id)}
                  disabled={deleting === addr.id}
                >
                  {deleting === addr.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressManager;
