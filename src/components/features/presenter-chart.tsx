"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = [
  "#00704A", // green (primary)
  "#F59E0B", // amber
  "#3B82F6", // blue
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#F97316", // orange
  "#14B8A6", // teal
  "#6366F1", // violet
];

interface PresenterChartProps {
  data: { name: string; count: number }[];
}

export function PresenterChart({ data }: PresenterChartProps) {
  return (
    <div>
      {/* 차트 */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
            <XAxis type="number" allowDecimals={false} hide />
            <YAxis
              type="category"
              dataKey="name"
              width={60}
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number) => [`${value}회`, "발제"]}
              contentStyle={{
                borderRadius: "14px",
                border: "1px solid #e5e7eb",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={20}>
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 리스트 */}
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between rounded-lg px-2 py-1.5">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm">{item.name}</span>
            </div>
            <span className="text-sm font-semibold">{item.count}회</span>
          </div>
        ))}
      </div>
    </div>
  );
}
