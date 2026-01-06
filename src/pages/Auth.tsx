import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { toast } from "sonner";
import { Mail, Phone, Eye, EyeOff, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Adresse email invalide");
const passwordSchema = z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères");
const phoneSchema = z.string().regex(/^\+?[0-9]{9,15}$/, "Numéro de téléphone invalide");

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading, signUp, signIn, signInWithPhone, verifyOtp } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);

      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Email ou mot de passe incorrect");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Connexion réussie !");
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password, firstName, lastName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Cet email est déjà utilisé");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Compte créé avec succès !");
          navigate("/");
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!otpSent) {
        phoneSchema.parse(phone);
        const { error } = await signInWithPhone(phone);
        if (error) {
          toast.error(error.message);
        } else {
          setOtpSent(true);
          toast.success("Code OTP envoyé !");
        }
      } else {
        const { error } = await verifyOtp(phone, otp);
        if (error) {
          toast.error("Code OTP invalide");
        } else {
          toast.success("Connexion réussie !");
          navigate("/");
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full gradient-lokebo flex items-center justify-center pulse-ring">
            <Loader2 className="w-8 h-8 animate-spin text-primary-foreground" />
          </div>
          <p className="text-muted-foreground animate-pulse">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-[fade-in_1s_ease-out]" />
        <div className="absolute top-1/2 -left-32 w-48 h-48 rounded-full bg-primary/5 blur-2xl animate-[fade-in_1.2s_ease-out]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-[fade-in_1.4s_ease-out]" />
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20 opacity-0 animate-[fade-in_0.5s_ease-out_0.2s_forwards]">
        <ThemeToggle />
      </div>

      {/* Header */}
      <header className="safe-top px-6 pt-12 pb-8 relative z-10">
        <div className="flex flex-col items-center">
          <div className="relative mb-6 animate-[scale-in_0.5s_ease-out]">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150" />
            <Logo variant="full" size="lg" className="relative z-10" />
          </div>
          
          <div
            className="flex items-center gap-2 mb-3 opacity-0 animate-[fade-in_0.5s_ease-out_0.2s_forwards]"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Votre mobilité simplifiée</span>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          
          <h1 
            className="text-2xl font-bold text-foreground mb-2 opacity-0 animate-[fade-in_0.5s_ease-out_0.3s_forwards]"
          >
            {isLogin ? "Bon retour !" : "Rejoignez-nous"}
          </h1>
          <p 
            className="text-center text-muted-foreground text-sm max-w-xs opacity-0 animate-[fade-in_0.5s_ease-out_0.4s_forwards]"
          >
            {isLogin 
              ? "Connectez-vous pour accéder à vos trajets" 
              : "Créez votre compte en quelques secondes"}
          </p>
        </div>
      </header>

      <main className="flex-1 px-6 py-6 relative z-10">
        {/* Auth Method Tabs */}
        <div className="w-full max-w-sm mx-auto">
          <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as "email" | "phone")} className="w-full">
            <TabsList 
              className="grid w-full grid-cols-2 mb-8 h-14 p-1.5 bg-muted/50 rounded-2xl opacity-0 animate-[fade-in_0.5s_ease-out_0.5s_forwards]"
            >
              <TabsTrigger 
                value="email" 
                className="gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-foreground transition-all duration-300"
              >
                <Mail className="w-4 h-4" />
                Email
              </TabsTrigger>
              <TabsTrigger 
                value="phone" 
                className="gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-foreground transition-all duration-300"
              >
                <Phone className="w-4 h-4" />
                Téléphone
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="mt-0">
              <form onSubmit={handleEmailAuth} className="space-y-5">
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-3 opacity-0 animate-[fade-in_0.4s_ease-out_forwards]">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium">Prénom</Label>
                      <Input
                        id="firstName"
                        placeholder="Jean"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="h-12 rounded-xl bg-muted/30 border-0 focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">Nom</Label>
                      <Input
                        id="lastName"
                        placeholder="Dupont"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="h-12 rounded-xl bg-muted/30 border-0 focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2 opacity-0 animate-[fade-in_0.5s_ease-out_0.6s_forwards]">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 rounded-xl bg-muted/30 border-0 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="space-y-2 opacity-0 animate-[fade-in_0.5s_ease-out_0.7s_forwards]">
                  <Label htmlFor="password" className="text-sm font-medium">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 rounded-xl bg-muted/30 border-0 pr-12 focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-2xl text-base font-semibold gradient-lokebo hover:opacity-90 transition-all shadow-lg shadow-primary/20 group opacity-0 animate-[fade-in_0.5s_ease-out_0.8s_forwards]" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isLogin ? "Se connecter" : "Créer mon compte"}
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="phone" className="mt-0">
              <form onSubmit={handlePhoneAuth} className="space-y-5">
                <div className="space-y-2 opacity-0 animate-[fade-in_0.5s_ease-out_0.6s_forwards]">
                  <Label htmlFor="phone" className="text-sm font-medium">Numéro de téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+237 6XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={otpSent}
                    required
                    className="h-12 rounded-xl bg-muted/30 border-0 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                {otpSent && (
                  <div className="space-y-3 animate-fade-in">
                    <Label htmlFor="otp" className="text-sm font-medium">Code OTP</Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      required
                      className="h-12 rounded-xl bg-muted/30 border-0 text-center text-lg tracking-widest focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm p-0 h-auto text-primary"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp("");
                      }}
                    >
                      ← Changer de numéro
                    </Button>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-14 rounded-2xl text-base font-semibold gradient-lokebo hover:opacity-90 transition-all shadow-lg shadow-primary/20 group opacity-0 animate-[fade-in_0.5s_ease-out_0.7s_forwards]" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {otpSent ? "Vérifier le code" : "Recevoir un code OTP"}
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center bg-muted/30 rounded-xl p-3 opacity-0 animate-[fade-in_0.5s_ease-out_0.8s_forwards]">
                  💡 L'OTP par SMS nécessite une configuration du fournisseur SMS.
                </p>
              </form>
            </TabsContent>
          </Tabs>

          {/* Toggle Login/Signup */}
          <div className="mt-8 p-4 rounded-2xl bg-muted/30 text-center opacity-0 animate-[fade-in_0.5s_ease-out_0.9s_forwards]">
            <p className="text-muted-foreground text-sm">
              {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
            </p>
            <Button
              variant="link"
              className="text-primary font-semibold p-0 h-auto text-base"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Créer un compte gratuitement" : "Se connecter"}
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 pb-8 pt-4 relative z-10 opacity-0 animate-[fade-in_0.5s_ease-out_1s_forwards]">
        <p className="text-xs text-muted-foreground text-center">
          En continuant, vous acceptez nos conditions d'utilisation
        </p>
      </footer>
    </div>
  );
};

export default Auth;
