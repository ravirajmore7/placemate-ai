"use client";

import { motion } from "framer-motion";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

export function ReadinessRing({ score, level, className }: { score: number; level: string; className?: string }) {
  const normalized = Math.max(0, Math.min(score, 100));
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative grid h-40 w-40 place-items-center rounded-full bg-background/60 shadow-inner">
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 160 160" aria-hidden="true">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="13"
          />
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeLinecap="round"
            strokeWidth="13"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        <div className="relative grid h-28 w-28 place-items-center rounded-full border bg-card/95 shadow-sm">
          <div className="text-center">
            <div className="text-4xl font-semibold tracking-tight">{Math.round(normalized)}</div>
            <div className="text-xs font-medium text-muted-foreground">out of 100</div>
          </div>
        </div>
      </div>
      <StatusBadge status={level} />
    </div>
  );
}
