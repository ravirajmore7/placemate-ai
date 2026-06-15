import { LoadingSkeleton } from "@/components/loading-skeleton";

export default function Loading() {
  return (
    <div className="grid gap-6">
      <LoadingSkeleton rows={5} />
      <LoadingSkeleton rows={4} />
    </div>
  );
}
