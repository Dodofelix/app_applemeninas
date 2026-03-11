import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import logoApple from "@/assets/simbolo apple.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha email e senha");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password);
      toast.success("Login realizado!");
      navigate("/admin", { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao entrar. Verifique email e senha.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-6 min-w-0">
        <div className="flex flex-col items-center gap-2">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-elevated p-2.5">
            <img src={logoApple} alt="Apple Meninas" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Painel Admin</h1>
          <p className="text-muted-foreground text-sm">Apple Meninas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@applemeninas.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={submitting}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            Entrar
          </Button>
        </form>

        <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
          Voltar ao início
        </Button>
      </div>
    </div>
  );
}
