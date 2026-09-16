'use client';

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export const MAIFELZ_CHART_COLORS = [
  '#5a165d',  // mAifelZ Plum Primary
  '#777f8b',  // mAifelZ Slate Grey
  '#87248c',  // Deep Magenta Accent
  '#2563eb',  // Enterprise Blue
  '#0d9488',  // Teal
  '#d97706',  // Amber
  '#4f46e5',  // Indigo
  '#059669',  // Emerald
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-lg min-w-[140px]">
      <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: entry.color || '#5a165d' }}>
          {typeof entry.value === 'number'
            ? `$${entry.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : entry.value}
        </p>
      ))}
    </div>
  );
};

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text x={x} y={y} fill="#ffffff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

interface Props {
  section: {
    chart_type: string;
    data: Record<string, any>[];
    x_key?: string;
    y_keys?: string[];
  };
  height?: number;
}

export default function ReportChart({ section, height = 320 }: Props) {
  const { chart_type, data, x_key = 'label', y_keys = ['value'] } = section;

  if (!data || data.length === 0) return null;

  const commonProps = {
    data,
    margin: { top: 10, right: 20, left: 0, bottom: 25 },
  };

  const axisStyle = { fill: '#64748b', fontSize: 11, fontWeight: 500 };
  const gridStyle = { stroke: '#f1f5f9', strokeDasharray: '3 3' as const };

  const renderChart = () => {
    switch (chart_type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey={x_key} tick={axisStyle} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} interval={0} angle={-25} textAnchor="end" height={50} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
            <Tooltip content={<CustomTooltip />} />
            {y_keys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={MAIFELZ_CHART_COLORS[i % MAIFELZ_CHART_COLORS.length]} radius={[6, 6, 0, 0]} maxBarSize={48} />
            ))}
          </BarChart>
        );

      case 'line':
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              {y_keys.map((key, i) => (
                <linearGradient key={key} id={`light-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={MAIFELZ_CHART_COLORS[i % MAIFELZ_CHART_COLORS.length]} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={MAIFELZ_CHART_COLORS[i % MAIFELZ_CHART_COLORS.length]} stopOpacity={0.0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey={x_key} tick={axisStyle} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
            <Tooltip content={<CustomTooltip />} />
            {y_keys.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={MAIFELZ_CHART_COLORS[i % MAIFELZ_CHART_COLORS.length]}
                strokeWidth={2.5}
                fill={`url(#light-grad-${i})`}
                dot={{ fill: MAIFELZ_CHART_COLORS[i % MAIFELZ_CHART_COLORS.length], r: 4, strokeWidth: 2, stroke: '#ffffff' }}
              />
            ))}
          </AreaChart>
        );

      case 'pie':
      case 'donut':
        const innerR = chart_type === 'donut' ? 65 : 0;
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey={x_key}
              cx="50%"
              cy="50%"
              innerRadius={innerR}
              outerRadius={120}
              paddingAngle={2}
              labelLine={false}
              label={CustomPieLabel}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={MAIFELZ_CHART_COLORS[i % MAIFELZ_CHART_COLORS.length]} stroke="#ffffff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span style={{ color: '#475569', fontSize: 12, fontWeight: 500 }}>{value}</span>}
            />
          </PieChart>
        );

      default:
        return (
          <BarChart {...commonProps}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey={x_key} tick={axisStyle} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill={MAIFELZ_CHART_COLORS[0]} radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        );
    }
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
