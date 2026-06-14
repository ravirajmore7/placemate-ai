import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ReadinessRing({ score, level, className }: { score: number; level: string; className?: string }) {
  const angle = Math.min(score, 100) * 3.6;
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className="grid h-36 w-36 place-items-center rounded-full"
        style={{ background: `conic-gradient(hsl(var(--primary)) ${angle}deg, hsl(var(--muted)) 0deg)` }}
      >
        <div className="grid h-28 w-28 place-items-center rounded-full bg-card shadow-inner">
          <div className="text-center">
            <div className="text-3xl font-semibold">{score}</div>
            <div className="text-xs text-muted-foreground">/ 100</div>
          </div>
        </div>
      </div>
      <Badge variant={score >= 81 ? "success" : score >= 61 ? "default" : score >= 41 ? "warning" : "destructive"}>
        {level}
      </Badge>
    </div>
  );
}
