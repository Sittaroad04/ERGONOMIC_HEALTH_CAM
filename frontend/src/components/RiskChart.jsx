import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
export default function RiskChart({ data, dataKey, color = "#e76f51", label }) {
  return (
    <div className="chart-panel">
      <div className="chart-heading">
        <span>{label}</span>
        <small>แนวโน้มล่าสุด</small>
      </div>
      <ResponsiveContainer width="100%" height={210}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d7d1c5" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} />
          <YAxis
            domain={[0, dataKey === "rula_score" ? 7 : 100]}
            tick={{ fontSize: 11 }}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
