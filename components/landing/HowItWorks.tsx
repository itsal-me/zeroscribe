"use client";

import { LinkIcon, ScanLine, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
    {
        number: "01",
        icon: LinkIcon,
        title: "Connect Gmail",
        description:
            "Grant read-only access in seconds. We never store your emails, never read OTPs, and never touch personal messages — only subscription metadata is extracted.",
        detail: "Takes about 30 seconds",
    },
    {
        number: "02",
        icon: ScanLine,
        title: "Auto-detection runs",
        description:
            "Our scanner parses up to 365 days of billing emails and surfaces every subscription — not just Apple or Google, but every service you pay for.",
        detail: "Scans 200+ receipts in seconds",
    },
    {
        number: "03",
        icon: LayoutDashboard,
        title: "Manage everything",
        description:
            "Review detected subscriptions, add missing ones manually, set reminders, and track spending over time.",
        detail: "Full control, always",
    },
];

export function HowItWorks() {
    return (
        <section
            id="how-it-works"
            className="py-16 sm:py-28 px-4 border-t border-border"
        >
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12 sm:mb-20"
                >
                    <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">
                        How it works
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                        Up and running in minutes
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        No manual data entry required. Connect once, and let the
                        automation do the rest.
                    </p>
                </motion.div>

                {/* Steps */}
                <div className="relative">
                    {/* Connecting line */}
                    <div className="hidden md:block absolute top-8 left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-8">
                        {steps.map((step, i) => {
                            const Icon = step.icon;
                            return (
                                <motion.div
                                    key={step.number}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{
                                        duration: 0.5,
                                        delay: i * 0.15,
                                    }}
                                    className="flex flex-col items-center md:items-start text-center md:text-left"
                                >
                                    {/* Icon circle */}
                                    <div className="relative mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center">
                                            <Icon className="w-5 h-5 text-accent" />
                                        </div>
                                        <span className="absolute -top-2 -right-2 text-xs font-bold text-muted-foreground/50 tabular-nums">
                                            {step.number}
                                        </span>
                                    </div>

                                    <h3 className="text-sm font-semibold mb-2">
                                        {step.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                                        {step.description}
                                    </p>
                                    <span className="text-xs font-medium text-accent/70 bg-accent-subtle px-2.5 py-1 rounded-full">
                                        {step.detail}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mt-20 text-center"
                >
                    <a
                        href="/login"
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-accent text-accent-foreground rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-accent/20"
                    >
                        Try it now — it&apos;s free
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
