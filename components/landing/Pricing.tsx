"use client";

import { Check, Zap } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

const plans = [
    {
        name: "Free",
        price: "$0",
        period: "forever",
        description:
            "Perfect for getting started and tracking your core subscriptions.",
        features: [
            "Up to 10 subscriptions",
            "Manual entry",
            "Renewal reminders",
            "Basic spending overview",
            "Dark & light mode",
        ],
        excluded: [
            "Gmail auto-detection",
            "Unlimited subscriptions",
            "Advanced analytics",
        ],
        cta: "Get started free",
        ctaHref: "/login",
        highlighted: false,
    },
    {
        name: "Pro",
        price: "$4",
        period: "per month",
        description:
            "For power users who want full automation and deep insights.",
        features: [
            "Unlimited subscriptions",
            "Gmail auto-detection",
            "Advanced analytics",
            "Custom categories",
            "Early renewal alerts",
            "Export to CSV",
            "Priority support",
        ],
        excluded: [],
        cta: "Start Pro free for 14 days",
        ctaHref: "/login?plan=pro",
        highlighted: true,
    },
];

export function Pricing() {
    return (
        <section id="pricing" className="py-28 px-4 border-t border-border">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">
                        Pricing
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                        Simple, honest pricing
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        No hidden fees, no usage caps that sneak up on you.
                        Start free, upgrade when you need more.
                    </p>
                </motion.div>

                {/* Plans */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className={cn(
                                "relative rounded-2xl border p-7 flex flex-col",
                                plan.highlighted
                                    ? "border-accent/50 bg-surface-elevated glow"
                                    : "border-border bg-surface",
                            )}
                        >
                            {plan.highlighted && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                                        <Zap className="w-3 h-3 fill-current" />
                                        Most popular
                                    </span>
                                </div>
                            )}

                            <div className="mb-6">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                    {plan.name}
                                </p>
                                <div className="flex items-end gap-1.5 mb-2">
                                    <span className="text-4xl font-extrabold tracking-tight">
                                        {plan.price}
                                    </span>
                                    <span className="text-sm text-muted-foreground pb-1.5">
                                        {plan.period}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {plan.description}
                                </p>
                            </div>

                            <ul className="space-y-2.5 mb-8 flex-1">
                                {plan.features.map((feature) => (
                                    <li
                                        key={feature}
                                        className="flex items-start gap-2.5"
                                    >
                                        <Check className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                                        <span className="text-xs text-foreground">
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                                {plan.excluded.map((feature) => (
                                    <li
                                        key={feature}
                                        className="flex items-start gap-2.5 opacity-35"
                                    >
                                        <div className="w-3.5 h-px bg-muted-foreground mt-2 shrink-0" />
                                        <span className="text-xs text-muted-foreground">
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={plan.ctaHref}
                                className={cn(
                                    "w-full py-2.5 text-sm font-semibold rounded-xl text-center transition-all duration-150",
                                    plan.highlighted
                                        ? "bg-accent text-accent-foreground hover:opacity-90 shadow-lg shadow-accent/25"
                                        : "bg-muted text-foreground hover:bg-muted/80 border border-border",
                                )}
                            >
                                {plan.cta}
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Footnote */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="text-center text-xs text-muted-foreground mt-8"
                >
                    14-day free trial, no credit card required. Cancel anytime.
                </motion.p>
            </div>
        </section>
    );
}
