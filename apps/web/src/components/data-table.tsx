"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import type { DataTableProps } from "@/components/data-table-client";

const LazyDataTable = dynamic<DataTableProps<unknown, unknown>>(
  () => import("@/components/data-table-client").then((module) => module.DataTableClient as ComponentType<DataTableProps<unknown, unknown>>),
  {
    ssr: false,
    loading: () => <LoadingSkeleton rows={5} />
  }
);

export function DataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
  const Component = LazyDataTable as ComponentType<DataTableProps<TData, TValue>>;
  return <Component {...props} />;
}
