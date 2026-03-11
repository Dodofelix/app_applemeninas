import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import logoApple from "@/assets/simbolo apple.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen min-h-dvh items-center justify-center bg-muted/40 relative px-4 sm:px-6">
      <div className="text-center space-y-6 sm:space-y-8 p-4 sm:p-8 max-w-md w-full animate-fade-in-up">
        <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-elevated p-2.5">
          <img src={logoApple} alt="Apple Meninas" className="w-full h-full object-contain brightness-0 invert" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Apple Meninas</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">Sistema de Gestão de Vendas e Contratos</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="min-h-[44px] w-full sm:w-auto" onClick={() => navigate("/preencher-pedido")}>
            <ShoppingCart className="h-4 w-4 mr-2 shrink-0" />
            Formulário do Cliente
          </Button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate("/admin")}
        className="absolute bottom-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-end pr-1 text-[10px] text-muted-foreground/70 hover:text-muted-foreground hover:underline transition-colors touch-manipulation"
      >
        Admin
      </button>
    </div>
  );
};

export default Index;
