import { LayoutDashboard, Users, Package, ShoppingCart, Calculator, LayoutList, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import logoApple from "@/assets/simbolo apple.png";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Painel", url: "/admin", icon: LayoutDashboard },
  { title: "Pedidos", url: "/admin/pedidos", icon: ShoppingCart },
  { title: "Calculadora", url: "/admin/calculadora", icon: Calculator },
  { title: "Clientes", url: "/admin/clientes", icon: Users },
  { title: "Demandas", url: "/admin/demandas", icon: LayoutList },
  { title: "Produtos", url: "/admin/produtos", icon: Package },
  { title: "Configurações", url: "/admin/configuracoes", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {!collapsed && (
          <div className="p-4 pb-5 flex items-center gap-3 border-b border-sidebar-border/80">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shrink-0 p-2 shadow-soft">
              <img src={logoApple} alt="Apple Meninas" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-sm leading-tight truncate">Apple Meninas</h2>
              <p className="text-[11px] text-muted-foreground">Gestão de Vendas</p>
            </div>
          </div>
        )}

        <SidebarGroup className={collapsed ? "pt-2" : "pt-3"}>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="rounded-lg transition-all duration-150 hover:bg-sidebar-accent py-2.5 group-data-[collapsible=icon]:!size-auto group-data-[collapsible=icon]:!min-h-9 group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!p-2.5"
                      activeClassName="bg-primary/10 text-primary font-medium shadow-soft"
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0", !collapsed && "mr-3")} />
                      {!collapsed && <span className="text-[13px] truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
