"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
} from "recharts";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import {
    formatCurrency,
    getMonthlyAmount,
    getTotalMonthlySpend,
    getBillingCycleLabel,
} from "@/lib/utils";
import { format, subMonths } from "date-fns";
import { useTheme } from "next-themes";

function buildMonthlyData(
    subscriptions: ReturnType<typeof useSubscriptions>["subscriptions"],
) {
    return Array.from({ length: 12 }, (_, i) => {
        const date = subMonths(new Date(), 11 - i);
        const amount = subscriptions
            .filter((s) => s.status === "active" || s.status === "trial")
            .reduce(
                (sum, sub) =>
                    sum + getMonthlyAmount(sub.amount, sub.billing_cycle),
                0,
            );
        return {
            month: format(date, "MMM yy"),
            amount: parseFloat(amount.toFixed(2)),
        };
    });
}

function buildByCycleData(
    subscriptions: ReturnType<typeof useSubscriptions>["subscriptions"],
) {
    const cycleMap: Record<string, number> = {};
    subscriptions
        .filter((s) => s.status === "active" || s.status === "trial")
        .forEach((s) => {
            const label = getBillingCycleLabel(s.billing_cycle);
            cycleMap[label] = (cycleMap[label] || 0) + 1;
        });
    return Object.entries(cycleMap).map(([name, count]) => ({ name, count }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                {payload.map(
                    (
                        entry: { name: string; value: number; color: string },
                        i: number,
                    ) => (
                        <p
                            key={i}
                            className="text-sm font-semibold"
                            style={{ color: entry.color }}
                        >
                            {entry.name === "amount"
                                ? formatCurrency(entry.value)
                                : `${entry.value} subscriptions`}
                        </p>
                    ),
                )}
            </div>
        );
    }
    return null;
}

export default function AnalyticsPage() {
    const { subscriptions, loading } = useSubscriptions();
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const monthlyData = buildMonthlyData(subscriptions);
    const byCycleData = buildByCycleData(subscriptions);
    const gridColor = isDark ? "hsl(240 4% 14%)" : "hsl(240 6% 90%)";
    const textColor = isDark ? "hsl(240 4% 52%)" : "hsl(240 4% 46%)";

    const monthlyTotal = getTotalMonthlySpend(subscriptions);
    const annualTotal = monthlyTotal * 12;
    const avgPerSub =
        subscriptions.length > 0
            ? monthlyTotal /
              subscriptions.filter((s) => s.status === "active").length
            : 0;

    const topSubscriptions = [...subscriptions]
        .filter((s) => s.status === "active" || s.status === "trial")
        .sort(
            (a, b) =>
                getMonthlyAmount(b.amount, b.billing_cycle) -
                getMonthlyAmount(a.amount, a.billing_cycle),
        )
        .slice(0, 5);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <DashboardHeader
                title="Analytics"
                subtitle="Subscription spending insights"
            />

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">
                    {/* Summary cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            {
                                label: "Monthly total",
                                value: formatCurrency(monthlyTotal),
                                sub: "All active subscriptions",
                            },
                            {
                                label: "Annual projection",
                                value: formatCurrency(annualTotal),
                                sub: "At current rates",
                            },
                            {
                                label: "Avg per subscription",
                                value: formatCurrency(avgPerSub),
                                sub: "Active only",
                            },
                        ].map((card) => (
                            <div
                                key={card.label}
                                className="bg-surface border border-border rounded-xl p-4"
                            >
                                <p className="text-xs text-muted-foreground mb-1">
                                    {card.label}
                                </p>
                                <p className="text-2xl font-bold tracking-tight">
                                    {card.value}
                                </p>
                                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                    {card.sub}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Monthly trend chart */}
                    <div className="bg-surface border border-border rounded-xl p-5">
                        <div className="mb-5">
                            <h3 className="text-xs font-semibold">
                                Spending trend
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Last 12 months (estimated)
                            </p>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart
                                data={monthlyData}
                                margin={{
                                    top: 4,
                                    right: 4,
                                    left: -20,
                                    bottom: 0,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id="trendGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="hsl(234 89% 74%)"
                                            stopOpacity={0.3}
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="hsl(234 89% 74%)"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke={gridColor}
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 10, fill: textColor }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: textColor }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `$${v}`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="hsl(234 89% 74%)"
                                    strokeWidth={2}
                                    fill="url(#trendGradient)"
                                    dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Billing cycle breakdown */}
                        <div className="bg-surface border border-border rounded-xl p-5">
                            <div className="mb-5">
                                <h3 className="text-xs font-semibold">
                                    By billing cycle
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Number of subscriptions
                                </p>
                            </div>
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart
                                    data={byCycleData}
                                    margin={{
                                        top: 4,
                                        right: 4,
                                        left: -20,
                                        bottom: 0,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke={gridColor}
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 10, fill: textColor }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10, fill: textColor }}
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar
                                        dataKey="count"
                                        fill="hsl(234 89% 74%)"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Most expensive */}
                        <div className="bg-surface border border-border rounded-xl p-5">
                            <div className="mb-4">
                                <h3 className="text-xs font-semibold">
                                    Top subscriptions
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    By monthly cost
                                </p>
                            </div>
                            <div className="space-y-3">
                                {topSubscriptions.length === 0 ? (
                                    <p className="text-xs text-muted-foreground py-8 text-center">
                                        No active subscriptions
                                    </p>
                                ) : (
                                    topSubscriptions.map((sub, i) => {
                                        const monthly = getMonthlyAmount(
                                            sub.amount,
                                            sub.billing_cycle,
                                        );
                                        const maxMonthly = getMonthlyAmount(
                                            topSubscriptions[0].amount,
                                            topSubscriptions[0].billing_cycle,
                                        );
                                        const pct =
                                            maxMonthly > 0
                                                ? (monthly / maxMonthly) * 100
                                                : 0;

                                        return (
                                            <div key={sub.id}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-muted-foreground/60 w-4 tabular-nums">
                                                            {i + 1}
                                                        </span>
                                                        <span className="text-xs truncate max-w-[140px]">
                                                            {sub.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-semibold">
                                                        {formatCurrency(
                                                            monthly,
                                                        )}
                                                        /mo
                                                    </span>
                                                </div>
                                                <div className="h-1 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-accent rounded-full transition-all duration-700"
                                                        style={{
                                                            width: `${pct}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
