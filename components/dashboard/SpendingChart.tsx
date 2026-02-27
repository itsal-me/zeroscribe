"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { cn, formatCurrency, getMonthlyAmount } from "@/lib/utils";
import type { Subscription } from "@/types";
import {
    format,
    subMonths,
    startOfMonth,
    endOfMonth,
    isWithinInterval,
    parseISO,
    addMonths,
} from "date-fns";
import { useTheme } from "next-themes";

interface SpendingChartProps {
    subscriptions: Subscription[];
    className?: string;
}

function buildMonthlyData(subscriptions: Subscription[]) {
    const months = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(new Date(), 5 - i);
        return {
            month: format(date, "MMM"),
            fullDate: date,
            amount: 0,
        };
    });

    subscriptions
        .filter((s) => s.status === "active" || s.status === "trial")
        .forEach((sub) => {
            const monthly = getMonthlyAmount(sub.amount, sub.billing_cycle);
            months.forEach((m) => {
                m.amount += monthly;
            });
        });

    return months.map((m) => ({
        month: m.month,
        amount: parseFloat(m.amount.toFixed(2)),
    }));
}

function buildCategoryData(subscriptions: Subscription[]) {
    const map = new Map<
        string,
        { name: string; amount: number; color: string; count: number }
    >();

    subscriptions
        .filter((s) => s.status === "active" || s.status === "trial")
        .forEach((sub) => {
            const key = sub.categories?.name || "Uncategorized";
            const color = sub.categories?.color || "#71717A";
            const monthly = getMonthlyAmount(sub.amount, sub.billing_cycle);
            const existing = map.get(key);
            if (existing) {
                existing.amount += monthly;
                existing.count++;
            } else {
                map.set(key, { name: key, amount: monthly, color, count: 1 });
            }
        });

    return Array.from(map.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6)
        .map((d) => ({ ...d, amount: parseFloat(d.amount.toFixed(2)) }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className="text-sm font-semibold">
                    {formatCurrency(payload[0].value)}
                </p>
            </div>
        );
    }
    return null;
}

export function SpendingChart({
    subscriptions,
    className,
}: SpendingChartProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const monthlyData = buildMonthlyData(subscriptions);
    const categoryData = buildCategoryData(subscriptions);

    const gridColor = isDark ? "hsl(240 4% 14%)" : "hsl(240 6% 90%)";
    const textColor = isDark ? "hsl(240 4% 52%)" : "hsl(240 4% 46%)";

    return (
        <div className={cn("grid grid-cols-1 lg:grid-cols-5 gap-4", className)}>
            {/* Monthly spending area chart */}
            <div className="lg:col-span-3 bg-surface border border-border rounded-xl p-5">
                <div className="mb-5">
                    <h3 className="text-xs font-semibold">Monthly spend trend</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Last 6 months
                    </p>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                    <AreaChart
                        data={monthlyData}
                        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient
                                id="spendGradient"
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
                            fill="url(#spendGradient)"
                            dot={{
                                fill: "hsl(234 89% 74%)",
                                r: 3,
                                strokeWidth: 0,
                            }}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Category breakdown */}
            <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5">
                <div className="mb-5">
                    <h3 className="text-xs font-semibold">Spend by category</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Monthly breakdown
                    </p>
                </div>

                {categoryData.length === 0 ? (
                    <div className="flex items-center justify-center h-[180px]">
                        <p className="text-xs text-muted-foreground">
                            No data yet
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {categoryData.map((cat) => {
                            const totalMonthly = categoryData.reduce(
                                (a, b) => a + b.amount,
                                0,
                            );
                            const pct =
                                totalMonthly > 0
                                    ? (cat.amount / totalMonthly) * 100
                                    : 0;

                            return (
                                <div key={cat.name}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{
                                                    backgroundColor: cat.color,
                                                }}
                                            />
                                            <span className="text-xs text-foreground truncate max-w-[100px]">
                                                {cat.name}
                                            </span>
                                        </div>
                                        <span className="text-xs font-medium">
                                            {formatCurrency(cat.amount)}
                                        </span>
                                    </div>
                                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${pct}%`,
                                                backgroundColor: cat.color,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
