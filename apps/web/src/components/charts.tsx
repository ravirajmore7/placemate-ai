"use client";

import dynamic from "next/dynamic";
import { LoadingSkeleton } from "@/components/loading-skeleton";

export const SimpleBarChart = dynamic(
  () => import("@/components/charts-client").then((module) => module.SimpleBarChartClient),
  {
    ssr: false,
    loading: () => <LoadingSkeleton rows={3} className="min-h-[260px]" />
  }
);

export const SimplePieChart = dynamic(
  () => import("@/components/charts-client").then((module) => module.SimplePieChartClient),
  {
    ssr: false,
    loading: () => <LoadingSkeleton rows={3} className="min-h-[260px]" />
  }
);
