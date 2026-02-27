"use client";

import {
    Lightbulb,
    TrendingDown,
    Clock,
    AlertTriangle,
    Layers,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn, formatCurrency, getMonthlyAmount } from "@/lib/utils";
import { getDaysUntilRenewal } from "@/lib/utils";
import type { Subscription } from "@/types";

interface Insight {
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    text: string;
    highlight?: string;
}

function buildInsights(subscriptions: Subscription[]): Insight[] {
    const active = subscriptions.filter(
        (s) => s.status === "active" || s.status === "trial",
    );
    const insights: Insight[] = [];

    // Streaming / entertainment category spend
    const streamingKeywords = [
        "entertainment",
        "streaming",
        "video",
        "music",
        "media",
    ];
    const streamingSubs = active.filter((s) =>
        streamingKeywords.some((kw) =>
            s.categories?.name?.toLowerCase().includes(kw),
        ),
    );
    if (streamingSubs.length >= 2) {
        const streamingYearly = streamingSubs.reduce(
            (t, s) => t + getMonthlyAmount(s.amount, s.billing_cycle) * 12,
            0,
        );
        insights.push({
            icon: TrendingDown,
            iconBg: "bg-blue-500/10",
            iconColor: "text-blue-400",
            text: `You are paying `,
            highlight: `${formatCurrency(streamingYearly)}/year`,
        });
        insights[insights.length - 1].text +=
            ` on ${streamingSubs.length} entertainment & streaming subscriptions.`;
    }

    // Trial ending soon (within 7 days)
    const trialsEndingSoon = subscriptions.filter((s) => {
        if (s.status !== "trial") return false;
        const days = getDaysUntilRenewal(s.next_billing_date);
        return days >= 0 && days <= 7;
    });
    if (trialsEndingSoon.length > 0) {
        const t = trialsEndingSoon[0];
        const days = getDaysUntilRenewal(t.next_billing_date);
        insights.push({
            icon: Clock,
            iconBg: "bg-warning-subtle",
            iconColor: "text-warning",
            text: `Trial for "${t.name}" ends in `,
            highlight: `${days} day${days !== 1 ? "s" : ""}`,
        });
        insights[insights.length - 1].text +=
            `. It will auto-charge ${formatCurrency(t.amount)} unless you cancel.`;
    }

    // Upcoming charges in next 7 days
    const upcoming7 = active.filter((s) => {
        const days = getDaysUntilRenewal(s.next_billing_date);
        return days >= 0 && days <= 7;
    });
    if (upcoming7.length > 0) {
        const chargeTotal = upcoming7.reduce((t, s) => t + s.amount, 0);
        insights.push({
            icon: AlertTriangle,
            iconBg: "bg-warning-subtle",
            iconColor: "text-warning",
            text: ``,
            highlight: `${upcoming7.length} renewal${upcoming7.length > 1 ? "s" : ""}`,
        });
        insights[insights.length - 1].text +=
            ` coming in the next 7 days — ${formatCurrency(chargeTotal)} will be charged to your accounts.`;
    }

    // Most expensive subscription — savings tip
    if (active.length >= 3) {
        const byMonthly = [...active].sort(
            (a, b) =>
                getMonthlyAmount(b.amount, b.billing_cycle) -
                getMonthlyAmount(a.amount, a.billing_cycle),
        );
        const most = byMonthly[0];
        const mostMonthly = getMonthlyAmount(most.amount, most.billing_cycle);
        if (mostMonthly >= 15) {
            insights.push({
                icon: TrendingDown,
                iconBg: "bg-success-subtle",
                iconColor: "text-success",
                text: `Canceling "${most.name}" would save you `,
                highlight: `${formatCurrency(mostMonthly * 12)}/year`,
            });
            insights[insights.length - 1].text +=
                `. Worth reviewing if you still use it regularly.`;
        }
    }

    // Subscriptions older than 6 months — potentially forgotten
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const oldSubs = active.filter(
        (s) => s.created_at && new Date(s.created_at) < sixMonthsAgo,
    );
    if (oldSubs.length > 2) {
        insights.push({
            icon: Layers,
            iconBg: "bg-purple-500/10",
            iconColor: "text-purple-400",
            text: `You have `,
            highlight: `${oldSubs.length} subscriptions`,
        });
        insights[insights.length - 1].text +=
            ` that have been active for over 6 months. Review them — some may no longer be worth keeping.`;
    }

    return insights.slice(0, 4);
}

interface InsightsPanelProps {
    subscriptions: Subscription[];
    className?: string;
}

export function InsightsPanel({
    subscriptions,
    className,
}: InsightsPanelProps) {
    const insights = buildInsights(subscriptions);

    if (insights.length === 0) return null;

    return (
        <div
            className={cn(
                "bg-surface border border-border rounded-xl p-5",
                className,
            )}
        >
            <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-accent-subtle flex items-center justify-center shrink-0">
                    <Lightbulb className="w-3.5 h-3.5 text-accent" />
                </div>
                <div>
                    <h3 className="text-xs font-semibold">Smart Insights</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                        Based on your subscriptions
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {insights.map((insight, i) => {
                    const Icon = insight.icon;
                    // Build the display text: split on highlight if present
                    const beforeHighlight = insight.text.split(
                        insight.highlight || "",
                    )[0];
                    const afterHighlight = insight.highlight
                        ? insight.text.slice(
                              beforeHighlight.length +
                                  (insight.highlight?.length ?? 0),
                          )
                        : "";

                    return (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: i * 0.07 }}
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-150"
                        >
                            <div
                                className={cn(
                                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                                    insight.iconBg,
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "w-3.5 h-3.5",
                                        insight.iconColor,
                                    )}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {beforeHighlight}
                                {insight.highlight && (
                                    <span className="font-semibold text-foreground">
                                        {insight.highlight}
                                    </span>
                                )}
                                {afterHighlight}
                            </p>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
