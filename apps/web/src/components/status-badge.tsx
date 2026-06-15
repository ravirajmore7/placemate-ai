import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { toTitle } from "@/lib/utils";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

const variantByStatus: Record<string, BadgeVariant> = {
  OPEN: "success",
  ELIGIBLE: "success",
  SELECTED: "success",
  PLACED: "success",
  COMPLETED: "success",
  HIGHLY_READY: "success",
  APPLIED: "info",
  SHORTLISTED: "info",
  TEST_SCHEDULED: "info",
  TEST_COMPLETED: "info",
  INTERVIEW_SCHEDULED: "info",
  PLACEMENT_READY: "info",
  PARTIALLY_READY: "warning",
  BASIC_READY: "warning",
  PREPARING: "warning",
  DRAFT: "warning",
  CHECKING: "neutral",
  SAVED: "neutral",
  CLOSED: "neutral",
  WITHDRAWN: "neutral",
  NOT_STARTED: "neutral",
  NOT_INTERESTED: "neutral",
  REJECTED: "destructive",
  NOT_ELIGIBLE: "destructive",
  NOT_READY: "destructive"
};

export function statusVariant(status?: string | null): BadgeVariant {
  if (!status) return "neutral";
  return variantByStatus[status.toUpperCase().replace(/\s+/g, "_")] ?? "secondary";
}

export function StatusBadge({
  status,
  label,
  className
}: {
  status?: string | null;
  label?: string;
  className?: string;
}) {
  const normalized = status ?? "UNKNOWN";
  return (
    <Badge variant={statusVariant(normalized)} className={className}>
      {label ?? toTitle(normalized)}
    </Badge>
  );
}
