"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))"
];

const tooltipStyle = {
  border: "1px solid hsl(var(--border))",
  borderRadius: "10px",
  background: "hsl(var(--popover) / 0.96)",
  color: "hsl(var(--popover-foreground))",
  boxShadow: "0 18px 44px hsl(222 47% 7% / 0.14)"
};

export function SimpleBarChartClient({ data, xKey, yKey }: { data: Array<Record<string, string | number>>; xKey: string; yKey: string }) {
  if (!data.length) {
    return <EmptyState icon={BarChart3} title="No chart data yet" message="Analytics will appear here as placement activity is recorded." />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} tick={{ fill: "hsl(var(--muted-foreground))" }} />
        <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.45)" }} contentStyle={tooltipStyle} />
        <Bar dataKey={yKey} radius={[8, 8, 2, 2]} fill="hsl(var(--chart-1))" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SimplePieChartClient({ data, nameKey, valueKey }: { data: Array<Record<string, string | number>>; nameKey: string; valueKey: string }) {
  if (!data.length) {
    return <EmptyState icon={BarChart3} title="No chart data yet" message="This breakdown will populate once records are available." />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey={valueKey} nameKey={nameKey} innerRadius={58} outerRadius={88} paddingAngle={4}>
          {data.map((_, index) => (
            <Cell key={`${String(data[index]?.[nameKey] ?? index)}-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}
