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

const COLORS = ["#14b8a6", "#22c55e", "#f59e0b", "#ef4444", "#6366f1", "#06b6d4"];

export function SimpleBarChart({ data, xKey, yKey }: { data: Array<Record<string, string | number>>; xKey: string; yKey: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} />
        <Tooltip cursor={{ fill: "hsl(var(--muted))" }} />
        <Bar dataKey={yKey} radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SimplePieChart({ data, nameKey, valueKey }: { data: Array<Record<string, string | number>>; nameKey: string; valueKey: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey={valueKey} nameKey={nameKey} innerRadius={54} outerRadius={86} paddingAngle={4}>
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
