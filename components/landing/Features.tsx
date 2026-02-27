"use client";

import {
    ShieldCheck,
    Eye,
    Trash2,
    Database,
    LogOut,
    DollarSign,
    TrendingUp,
    Bell,
    Clock,
    Search,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const trustPoints = [
    {
        icon: ShieldCheck,
        text: "We use Google's official read-only OAuth  the strictest access scope available",
    },
    {
        icon: Eye,
        text: "We cannot send, delete, or modify your emails  ever",
    },
    {
        icon: Database,
        text: "Raw email content is never stored  only subscription metadata is extracted",
    },
    {
        icon: Trash2,
        text: "We only read billing-related emails. OTPs, personal mail, and attachments are ignored",
    },
    {
        icon: LogOut,
        text: "Disconnect anytime from Settings  access is fully revoked instantly",
    },
];

const discoveries = [
    {
        icon: DollarSign,
        label: "Your total monthly subscription cost",
        description: "See exactly how much you're spending each month at a glance.",
        color: "text-accent",
        bg: "bg-accent/10",
    },
    {
        icon: TrendingUp,
        label: "Annual forecast",
        description: "12-month projection of what you'll pay if nothing changes.",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
    },
    {
        icon: Bell,
        label: "Upcoming renewals",
        description: "Know what's charging next week  before it hits your card.",
        color: "text-amber-400",
        bg: "bg-amber-500/10",
    },
    {
        icon: Clock,
        label: "Trials ending soon",
        description: "Get warned before a free trial converts to a paid subscription.",
        color: "text-rose-400",
        bg: "bg-rose-500/10",
    },
    {
        icon: Search,
        label: "Subscriptions you may have forgotten",
        description: "Detect recurring payments you stopped noticing a long time ago.",
        color: "text-purple-400",
        bg: "bg-purple-500/10",
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
        <>
            {/*  Trust Block  */}
            <section
                id="privacy"
                className="py-16 sm:py-24 px-4 border-t border-border"
            >
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-10 sm:mb-14"
                    >
                        <p className="text-xs font-semibold uppercase tracking-widest text-success mb-4">
                            Privacy
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                            Your privacy comes first
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                            We know you're trusting us with Gmail access.
                            Here's exactly what we do  and don't do 
                            with it.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10"
                    >
                        {trustPoints.map((point) => {
                            const Icon = point.icon;
                            return (
                                <motion.div
                                    key={point.text}
                                    variants={cardVariants}
                                    className="flex items-start gap-3 p-4 rounded-xl border border-success/20 bg-success-subtle/20 hover:bg-success-subtle/40 transition-colors duration-200"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-success-subtle flex items-center justify-center shrink-0 mt-0.5">
                                        <Icon className="w-3.5 h-3.5 text-success" />
                                    </div>
                                    <p className="text-xs text-foreground leading-relaxed">
                                        {point.text}
                                    </p>
                                </motion.div>
                            );
                        })}

                        {/* Google badge card */}
                        <motion.div
                            variants={cardVariants}
                            className="flex items-center justify-center gap-3 p-4 rounded-xl border border-border bg-surface col-span-1 sm:col-span-2 lg:col-span-1"
                        >
                            <div className="text-center">
                                <p className="text-xs font-semibold text-foreground mb-1">
                                    Secured by Google OAuth 2.0
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    Gmail's official authorization protocol. Your password is never shared with us.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/*  Value Section  */}
            <section
                id="features"
                className="py-16 sm:py-24 px-4 border-t border-border"
            >
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-10 sm:mb-14"
                    >
                        <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">
                            What you get
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                            What you'll discover
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                            Connect Gmail once. Instantly see what's been
                            quietly draining your account.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12"
                    >
                        {discoveries.map((item) => {
                            const Icon = item.icon;
                            return (
                                <motion.div
                                    key={item.label}
                                    variants={cardVariants}
                                    className="group p-5 rounded-xl border border-border bg-surface hover:border-border/60 hover:bg-surface-elevated transition-all duration-200 cursor-default"
                                >
                                    <div
                                        className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${item.bg} mb-4`}
                                    >
                                        <Icon
                                            className={`w-4 h-4 ${item.color}`}
                                        />
                                    </div>
                                    <h3 className="text-sm font-semibold mb-1.5">
                                        {item.label}
                                    </h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {item.description}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {/* Final CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-center py-10 sm:py-14 px-6 rounded-2xl border border-border bg-surface-elevated"
                    >
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                            See how much you're really spending
                        </h2>
                        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
                            No manual setup. Connect Gmail and get your full
                            subscription picture in under 30 seconds.
                        </p>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold bg-accent text-accent-foreground rounded-xl hover:opacity-90 transition-all duration-150 shadow-lg shadow-accent/20"
                        >
                            Analyze My Subscriptions
                        </Link>
                        <p className="mt-3 text-[11px] text-muted-foreground">
                            Read-only Gmail access. We never send or delete
                            emails.
                        </p>
                    </motion.div>
                </div>
            </section>
        </>
    );
}
