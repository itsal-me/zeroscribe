"use client";

import {
    Mail,
    PlusCircle,
    BarChart3,
    Bell,
    Shield,
    RefreshCw,
    Zap,
    Globe,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
    {
        icon: Mail,
        title: "Gmail auto-detection",
        description:
            "Connect your Gmail and let paySnap scan receipts, invoices, and billing emails to automatically surface subscriptions you may have forgotten.",
        accent: "text-blue-400",
        bg: "bg-blue-500/10",
    },
    {
        icon: PlusCircle,
        title: "Manual entry",
        description:
            "Add any subscription manually with full control — set the amount, billing cycle, category, and renewal date exactly how you want.",
        accent: "text-accent",
        bg: "bg-accent/10",
    },
    {
        icon: Bell,
        title: "Smart reminders",
        description:
            "Get notified days before a renewal hits. Configure how early you want alerts so you can cancel or budget accordingly.",
        accent: "text-amber-400",
        bg: "bg-amber-500/10",
    },
    {
        icon: BarChart3,
        title: "Spending analytics",
        description:
            "Visualize your monthly and annual subscription spend with beautiful charts. Break down costs by category and spot where your money goes.",
        accent: "text-emerald-400",
        bg: "bg-emerald-500/10",
    },
    {
        icon: RefreshCw,
        title: "Real-time sync",
        description:
            "Every change syncs instantly across all your devices using Supabase Realtime. Your subscription list is always up to date.",
        accent: "text-purple-400",
        bg: "bg-purple-500/10",
    },
    {
        icon: Shield,
        title: "Secure by default",
        description:
            "Row-level security ensures your data is only visible to you. Gmail tokens are encrypted at rest and never shared.",
        accent: "text-rose-400",
        bg: "bg-rose-500/10",
    },
    {
        icon: Zap,
        title: "Instant insights",
        description:
            "See your total monthly spend, upcoming renewals, and categories at a glance on your personal dashboard.",
        accent: "text-yellow-400",
        bg: "bg-yellow-500/10",
    },
    {
        icon: Globe,
        title: "Any currency",
        description:
            "Track subscriptions in USD, EUR, GBP, and more. paySnap normalizes everything for clear reporting.",
        accent: "text-cyan-400",
        bg: "bg-cyan-500/10",
    },
];

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
};

export function Features() {
    return (
        <section id="features" className="py-28 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">
                        Features
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                        Everything you need to
                        <br />
                        stay in control
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                        Built for people who want clarity over their recurring
                        payments — without the complexity.
                    </p>
                </motion.div>

                {/* Feature grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={feature.title}
                                variants={cardVariants}
                                className="group relative p-5 rounded-xl border border-border bg-surface hover:border-border/80 hover:bg-surface-elevated transition-all duration-200 cursor-default"
                            >
                                <div
                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${feature.bg} mb-4`}
                                >
                                    <Icon
                                        className={`w-4 h-4 ${feature.accent}`}
                                    />
                                </div>
                                <h3 className="text-sm font-semibold mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
