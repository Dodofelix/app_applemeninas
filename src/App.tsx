import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PublicOrderForm from "./pages/PublicOrderForm";
import { AdminLayout } from "./components/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Clients from "./pages/admin/Clients";
import Orders from "./pages/admin/Orders";
import SettingsPage from "./pages/admin/SettingsPage";
import Calculadora from "./pages/admin/Calculadora";
import Demandas2 from "./pages/admin/Demandas2";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const queryClient = new QueryClient();

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace />;
  return <AdminLayout>{children}</AdminLayout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/preencher-pedido" element={<PublicOrderForm />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
            <Route path="/admin/clientes" element={<AdminRoute><Clients /></AdminRoute>} />
            <Route path="/admin/produtos" element={<AdminRoute><Products /></AdminRoute>} />
            <Route path="/admin/pedidos" element={<AdminRoute><Orders /></AdminRoute>} />
            <Route path="/admin/calculadora" element={<AdminRoute><Calculadora /></AdminRoute>} />
            <Route path="/admin/demandas" element={<AdminRoute><Demandas2 /></AdminRoute>} />
            <Route path="/admin/configuracoes" element={<AdminRoute><SettingsPage /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
