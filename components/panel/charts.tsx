"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCOP } from "@/lib/format";

const axis = { stroke: "var(--chart-axis)", fontSize: 12, tickLine: false };

/** Visitas por día (línea). La tabla oculta da la misma información a lectores de pantalla. */
export function VisitsChart({
  data,
  title,
}: {
  data: { label: string; visitors: number; clicks: number }[];
  title: string;
}) {
  return (
    <figure className="grid min-w-0 gap-3 overflow-hidden">
      <figcaption className="font-bold">{title}</figcaption>
      <div className="h-56 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart accessibilityLayer={false} data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="label" {...axis} interval="preserveStartEnd" minTickGap={16} />
            <YAxis {...axis} allowDecimals={false} width={40} />
            <Tooltip
              contentStyle={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 8 }}
            />
            <Line
              type="linear"
              dataKey="visitors"
              name="Visitantes"
              stroke="var(--chart-1)"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey="clicks"
              name="Clics en Pedir"
              stroke="var(--chart-3)"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="flex flex-wrap gap-4 text-sm" aria-hidden="true">
        <span className="flex items-center gap-2">
          <span className="inline-block h-1 w-6 rounded bg-[var(--chart-1)]" />
          Visitantes
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-0 w-6 border-t-2 border-dashed border-[var(--chart-3)]" />
          Clics en Pedir
        </span>
      </p>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>Día</th>
            <th>Visitantes</th>
            <th>Clics en Pedir</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              <td>{d.visitors}</td>
              <td>{d.clicks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Barras horizontales con etiqueta directa (sirven en claro y oscuro sin depender del color). */
export function HBars({
  data,
  title,
  money,
}: {
  data: { label: string; value: number }[];
  title: string;
  money?: boolean;
}) {
  const fmt = (v: number) => (money ? formatCOP(v) : String(v));
  return (
    <figure className="grid min-w-0 gap-3 overflow-hidden">
      <figcaption className="font-bold">{title}</figcaption>
      <div style={{ height: Math.max(120, data.length * 40) }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            accessibilityLayer={false}
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
            <XAxis
              type="number"
              {...axis}
              allowDecimals={false}
              tickFormatter={(v) => (money ? `${Math.round(v / 1000)}k` : String(v))}
            />
            <YAxis type="category" dataKey="label" {...axis} width={110} />
            <Tooltip
              formatter={(v) => fmt(Number(v))}
              contentStyle={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 8 }}
            />
            <Bar
              dataKey="value"
              name={title}
              fill="var(--chart-1)"
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
              label={{
                position: "insideRight",
                fill: "var(--color-on-accent)",
                fontSize: 12,
                formatter: (v: unknown) => (Number(v) > 0 ? fmt(Number(v)) : ""),
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{fmt(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
