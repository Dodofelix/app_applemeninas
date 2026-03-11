import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/mock-data";

const statusStyles: Record<OrderStatus, string> = {
  'Contrato pendente': 'bg-muted text-muted-foreground border-border',
  'Contrato gerado': 'bg-info/10 text-info border-info/20',
  'Aguardando assinatura': 'bg-warning/10 text-warning border-warning/20',
  'Contrato assinado': 'bg-success/10 text-success border-success/20',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={`text-[11px] font-medium px-2.5 py-0.5 ${statusStyles[status]}`}>
      {status}
    </Badge>
  );
}
