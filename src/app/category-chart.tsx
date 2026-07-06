"use client";

import { useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type CategoryDatum = { name: string; value: number; color: string };

export function CategoryChart({
  weekData,
  monthData,
}: {
  weekData: CategoryDatum[];
  monthData: CategoryDatum[];
}) {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const data = period === "week" ? weekData : monthData;
  const hasData = data.some((d) => d.value > 0);

  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">รายจ่ายตามหมวด</h2>
        <div className="flex rounded-full bg-black/5 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setPeriod("week")}
            className={`rounded-full px-3 py-1 font-medium ${
              period === "week" ? "bg-card shadow-sm" : "text-muted"
            }`}
          >
            สัปดาห์
          </button>
          <button
            type="button"
            onClick={() => setPeriod("month")}
            className={`rounded-full px-3 py-1 font-medium ${
              period === "month" ? "bg-card shadow-sm" : "text-muted"
            }`}
          >
            เดือน
          </button>
        </div>
      </div>

      {hasData ? (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted)" }}
              />
              <YAxis hide domain={[0, "dataMax"]} />
              <Tooltip
                formatter={(value) => [`฿${Number(value).toLocaleString("en-US")}`, "ยอดรวม"]}
                cursor={{ fill: "rgba(0,0,0,0.03)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                  fontFamily: "var(--font-anuphan)",
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={36} isAnimationActive={false}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted">
          ยังไม่มีรายจ่ายใน{period === "week" ? "สัปดาห์" : "เดือน"}นี้
        </p>
      )}
    </div>
  );
}
