"use client";

import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface YearlyMeetingChartProps {
  data: { year: string; count: number }[];
}

export function YearlyMeetingChart({ data }: YearlyMeetingChartProps) {
  if (data.length === 0) return null;

  // 연도가 1개뿐이면 텍스트로 표시
  if (data.length === 1) {
    return (
      <Card className="rounded-[20px]">
        <CardContent>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Calendar className="text-primary h-4 w-4" />
            연간 모임
          </h3>
          <p className="text-muted-foreground text-center text-sm">
            {data[0].year}년에 <span className="text-primary font-bold">{data[0].count}회</span>{" "}
            모임을 가졌습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[20px]">
      <CardContent>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Calendar className="text-primary h-4 w-4" />
          연간 모임
        </h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="year" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                formatter={(value) => [`${value}회`, "모임"]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
