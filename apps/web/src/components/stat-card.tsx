"use client";

import * as React from "react";
import type { ElementType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function AnimatedValue({ value }: { value: string | number }) {
  const [display, setDisplay] = React.useState(typeof value === "number" ? 0 : value);

  React.useEffect(() => {
    if (typeof value !== "number") {
      setDisplay(value);
      return;
    }

    const duration = 620;
    const startedAt = performance.now();
    let frame = 0;

    const tick = (time: number) => {
      const progress = Math.min((time - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  if (typeof value !== "number") return <>{display}</>;

  const numeric = typeof display === "number" ? display : value;
  return (
    <>
      {numeric.toLocaleString("en-IN", {
        maximumFractionDigits: Number.isInteger(value) ? 0 : 1
      })}
    </>
  );
}

export function StatCard({
  title,
  value,
  helper,
  icon: Icon,
  className
}: {
  title: string;
  value: string | number;
  helper?: string;
  icon: ElementType;
  className?: string;
}) {
  return (
    <Card className={cn("card-gradient soft-shadow overflow-hidden transition-all duration-200 hover:-translate-y-0.5", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="grid h-9 w-9 place-items-center rounded-lg border bg-background/70 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">
          <AnimatedValue value={value} />
        </div>
        {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
