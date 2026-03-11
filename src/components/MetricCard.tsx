import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
}

export function MetricCard({ title, value, icon: Icon, description }: MetricCardProps) {
  return (
    <Card className="hover-lift border-l-4 border-l-primary shadow-soft overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0 text-left space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="text-xl font-bold tracking-tight text-foreground tabular-nums break-all pr-0.5">{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
