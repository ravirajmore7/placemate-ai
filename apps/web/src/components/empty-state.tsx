import type { ElementType, ReactNode } from "react";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = SearchX,
  title,
  message,
  action,
  className
}: {
  icon?: ElementType;
  title: string;
  message: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid min-h-48 place-items-center rounded-xl border border-dashed bg-muted/25 p-8 text-center",
        className
      )}
    >
      <div className="mx-auto grid max-w-md justify-items-center gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-xl border bg-background text-primary shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold tracking-tight">{title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{message}</p>
        </div>
        {action ? <div className="pt-1">{action}</div> : null}
      </div>
    </div>
  );
}

export function EmptyStateAction({ children, ...props }: React.ComponentProps<typeof Button>) {
  return <Button {...props}>{children}</Button>;
}
