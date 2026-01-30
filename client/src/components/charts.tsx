import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { UsageEntry } from "@shared/schema";

interface ChartData {
  name: string;
  electricity: number;
  water: number;
}

interface UsageChartsProps {
  weeklyData: UsageEntry[];
}

export function UsageCharts({ weeklyData }: UsageChartsProps) {
  if (!weeklyData || weeklyData.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Recycling Progress</h3>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Hydration Progress</h3>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </div>
      </div>
    );
  }

  // Sort data by week start date to show most recent on the right
  const sortedData = [...weeklyData].sort((a, b) => 
    new Date(a.weekStartDate).getTime() - new Date(b.weekStartDate).getTime()
  );

  const chartData: ChartData[] = sortedData.map((entry) => {
    const date = new Date(entry.weekStartDate);
    const weekLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return {
      name: `Week ${weekLabel}`,
      electricity: parseFloat(entry.electricityUsage || "0"),
      water: parseFloat(entry.waterUsage || "0"),
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Recycling Progress Chart */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">Weekly Recycling Wins</h3>
          <select 
            className="text-sm border border-border bg-input text-foreground rounded-md px-3 py-1"
            onChange={(e) => {
              const weeks = parseInt(e.target.value);
              // Filter data to show only selected number of weeks
            }}
          >
            <option value="4">Last 4 weeks</option>
            <option value="8">Last 8 weeks</option>
            <option value="12">Last 12 weeks</option>
          </select>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(156, 16%, 42%)', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(156, 16%, 42%)', fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="electricity"
                stroke="hsl(155, 60%, 38%)"
                strokeWidth={3}
                dot={{ fill: "hsl(155, 60%, 38%)", strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, fill: "hsl(155, 60%, 38%)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hydration Chart */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">Weekly Water Intake</h3>
          <select 
            className="text-sm border border-border bg-input text-foreground rounded-md px-3 py-1"
            onChange={(e) => {
              const weeks = parseInt(e.target.value);
              // Filter data to show only selected number of weeks
            }}
          >
            <option value="4">Last 4 weeks</option>
            <option value="8">Last 8 weeks</option>
            <option value="12">Last 12 weeks</option>
          </select>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(156, 16%, 42%)', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(156, 16%, 42%)', fontSize: 12 }}
              />
              <Bar
                dataKey="water"
                fill="hsl(190, 70%, 40%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
