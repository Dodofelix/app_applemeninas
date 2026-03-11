import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useFirestore";
import { LogOut } from "lucide-react";

const PREFIX = "Bem vindo, ";
const SUFFIX = "! 👋";
const TYPING_MS = 85;

function getFriendlyName(user: ReturnType<typeof useAuth>["user"]) {
  const fallback = "Admin";
  if (!user) return fallback;
  const email = user.email ?? "";
  const display = user.displayName?.split(" ")[0] ?? "";
  const local = email.split("@")[0] ?? "";
  const lowerLocal = local.toLowerCase();

  if (lowerLocal.startsWith("vi")) return "Vi";
  if (lowerLocal.startsWith("gi")) return "Gi";
  if (display) return display;
  if (local) return local.charAt(0).toUpperCase() + local.slice(1);
  return fallback;
}

function renderTyped(typed: string, name: string) {
  if (typed.length <= PREFIX.length) {
    return <>{typed}</>;
  }
  const nameLength = name.length;
  const namePart = typed.slice(PREFIX.length, PREFIX.length + nameLength);
  const afterName = typed.slice(PREFIX.length + nameLength);
  return (
    <>
      {PREFIX}
      <span className="font-bold text-primary">{namePart}</span>
      {afterName}
    </>
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, signOut } = useAuth();
  const { data: profile } = useUserProfile(user?.uid);
  const name = (profile?.displayName?.trim() || getFriendlyName(user)).trim() || "Admin";
  const header = PREFIX + name + SUFFIX;
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Quando o nome mudar (ex: Configurações › Usuário), reinicia a animação
    setTyped("");
    setDone(false);
  }, [header]);

  useEffect(() => {
    if (typed.length >= header.length) {
      setDone(true);
      return;
    }
    const t = setTimeout(() => {
      setTyped(header.slice(0, typed.length + 1));
    }, TYPING_MS);
    return () => clearTimeout(t);
  }, [typed, header]);

  return (
    <SidebarProvider>
      <div className="min-h-screen min-h-dvh flex w-full min-w-0">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-14 shrink-0 flex items-center justify-between border-b border-border/80 px-4 sm:px-6 bg-background/95 backdrop-blur-sm shadow-sm gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger className="shrink-0 mr-2 sm:mr-4 min-h-[44px] min-w-[44px]" />
              <span className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Apple Meninas</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <span className="hidden sm:inline text-xs sm:text-sm font-medium text-muted-foreground truncate max-w-[260px] animate-surgir">
                {renderTyped(typed, name)}
                {!done && <span className="animate-pulse opacity-80">|</span>}
              </span>
              <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px] touch-manipulation" onClick={() => signOut()} title="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 overflow-auto bg-muted/30 min-h-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
