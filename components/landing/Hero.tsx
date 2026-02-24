"use client";

import Link from "next/link";
import {
    ArrowRight,
    Sparkles,
    CreditCard,
    TrendingUp,
    Bell,
    Zap,
    Shield,
} from "lucide-react";
import { motion } from "framer-motion";

const mockSubscriptions = [
    {
        name: "Netflix",
        amount: "$15.99",
        status: "active",
        color: "#E50914",
        daysLeft: 12,
    },
    {
        name: "Spotify",
        amount: "$9.99",
        status: "active",
        color: "#1DB954",
        daysLeft: 5,
    },
    {
        name: "Adobe CC",
        amount: "$54.99",
        status: "active",
        color: "#FF0000",
        daysLeft: 18,
    },
    {
        name: "GitHub",
        amount: "$4.00",
        status: "trial",
        color: "#181717",
        daysLeft: 2,
    },
    {
        name: "Notion",
        amount: "$8.00",
        status: "active",
        color: "#000000",
        daysLeft: 24,
    },
];

function DashboardPreview() {
    return (
        <div className="relative w-full max-w-3xl mx-auto">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-accent/10 via-transparent to-transparent rounded-2xl blur-2xl" />

            {/* ── Desktop: Browser chrome (sm+) ── */}
            <div className="hidden sm:block relative rounded-xl border border-border bg-surface shadow-2xl overflow-hidden">
                {/* Browser bar */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-surface-elevated">
                    <div className="w-2.5 h-2.5 rounded-full bg-danger/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
                    <div className="ml-3 flex-1 bg-muted rounded-md px-3 py-1 text-xs text-muted-foreground truncate">
                        app.paysnap.com/dashboard
                    </div>
                </div>

                {/* Dashboard content */}
                <div className="flex h-64 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-44 border-r border-border bg-surface-elevated p-3 flex flex-col gap-1 shrink-0">
                        <div className="px-3 py-1.5 text-xs text-accent font-medium rounded-lg bg-accent-subtle flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-accent/40" />
                            Dashboard
                        </div>
                        {["Subscriptions", "Analytics", "Settings"].map(
                            (item) => (
                                <div
                                    key={item}
                                    className="px-3 py-1.5 text-xs text-muted-foreground rounded-lg flex items-center gap-2"
                                >
                                    <div className="w-3 h-3 rounded-sm bg-border" />
                                    {item}
                                </div>
                            ),
                        )}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 p-4 overflow-hidden min-w-0">
                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {[
                                { label: "Monthly", value: "$123.45" },
                                { label: "Active", value: "12" },
                                { label: "This week", value: "3 renewals" },
                            ].map((stat) => (
                                <div
                                    key={stat.label}
                                    className="rounded-lg bg-muted p-2"
                                >
                                    <div className="text-[10px] text-muted-foreground mb-0.5 truncate">
                                        {stat.label}
                                    </div>
                                    <div className="text-sm font-semibold truncate">
                                        {stat.value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Subscription list */}
                        <div className="space-y-1.5">
                            {mockSubscriptions.slice(0, 4).map((sub, i) => (
                                <motion.div
                                    key={sub.name}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        delay: 0.1 + i * 0.1,
                                        duration: 0.3,
                                    }}
                                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-1.5"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div
                                            className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                                            style={{
                                                backgroundColor:
                                                    sub.color + "88",
                                            }}
                                        >
                                            {sub.name[0]}
                                        </div>
                                        <span className="text-xs font-medium truncate">
                                            {sub.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span
                                            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                                sub.status === "trial"
                                                    ? "bg-warning-subtle text-warning"
                                                    : "bg-success-subtle text-success"
                                            }`}
                                        >
                                            {sub.status}
                                        </span>
                                        <span className="text-xs font-medium">
                                            {sub.amount}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Mobile: Phone app style (< sm) ── */}
            <div className="sm:hidden relative rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
                {/* App header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-elevated">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-accent flex items-center justify-center shrink-0">
                            <Zap className="w-3 h-3 text-accent-foreground fill-current" />
                        </div>
                        <span className="text-xs font-semibold">Dashboard</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                        5 active
                    </span>
                </div>

                {/* 2-col stats */}
                <div className="grid grid-cols-2 gap-2 p-3">
                    {[
                        { label: "Monthly spend", value: "$123.45" },
                        { label: "Active subs", value: "12" },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-xl bg-muted p-3"
                        >
                            <div className="text-[10px] text-muted-foreground mb-1">
                                {stat.label}
                            </div>
                            <div className="text-sm font-bold">
                                {stat.value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Subscription list */}
                <div className="px-3 pb-4 space-y-1.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Upcoming renewals
                    </p>
                    {mockSubscriptions.slice(0, 4).map((sub, i) => (
                        <motion.div
                            key={sub.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + i * 0.1, duration: 0.3 }}
                            className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                    style={{
                                        backgroundColor: sub.color + "88",
                                    }}
                                >
                                    {sub.name[0]}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-medium truncate">
                                        {sub.name}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                        in {sub.daysLeft}d
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                        sub.status === "trial"
                                            ? "bg-warning-subtle text-warning"
                                            : "bg-success-subtle text-success"
                                    }`}
                                >
                                    {sub.status}
                                </span>
                                <span className="text-xs font-semibold">
                                    {sub.amount}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.12, delayChildren: 0.2 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
};

export function Hero() {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-10 sm:pb-16 px-4 overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 dot-grid opacity-40" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto"
            >
                {/* Badge */}
                <motion.div variants={itemVariants}>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/30 bg-accent-subtle/50 mb-8">
                        <Sparkles className="w-3 h-3 text-accent" />
                        <span className="text-xs font-medium text-accent">
                            Not just Apple &amp; Google — all your subscriptions
                        </span>
                    </div>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    variants={itemVariants}
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-balance mb-5 sm:mb-6"
                >
                    Every subscription,
                    <br />
                    <span className="gradient-text">finally organized.</span>
                </motion.h1>

                {/* Subtext */}
                <motion.p
                    variants={itemVariants}
                    className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed mb-10 text-balance"
                >
                    Know what you&apos;re paying, and stop wasting money.
                    paySnap automatically detects all your recurring charges from
                    Gmail — or you can add them manually. Budget-aware analytics,
                    renewal alerts, and full control in one place.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row gap-3 mb-8 sm:mb-16 w-full sm:w-auto"
                >
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold bg-accent text-accent-foreground rounded-xl hover:opacity-90 transition-all duration-150 shadow-lg shadow-accent/20 glow-sm"
                    >
                        Start for free
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <a
                        href="#how-it-works"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-foreground bg-surface border border-border rounded-xl hover:bg-muted transition-colors duration-150"
                    >
                        See how it works
                    </a>
                </motion.div>

                {/* Social proof */}
                <motion.div
                    variants={itemVariants}
                    className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-8 sm:mb-16 text-xs text-muted-foreground"
                >
                    <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 shrink-0" />
                        <span>No credit card required</span>
                    </div>
                    <div className="hidden sm:block h-3 w-px bg-border" />
                    <div className="flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 shrink-0" />
                        <span>Never miss a renewal again</span>
                    </div>
                    <div className="hidden sm:block h-3 w-px bg-border" />
                    <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                        <span>Budget-aware analytics</span>
                    </div>
                    <div className="hidden sm:block h-3 w-px bg-border" />
                    <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 shrink-0" />
                        <span>Works on any device, anywhere</span>
                    </div>
                </motion.div>

                {/* Privacy trust strip */}
                <motion.div
                    variants={itemVariants}
                    className="w-full max-w-2xl mb-8 sm:mb-12"
                >
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 px-5 py-3 rounded-2xl border border-border bg-surface/60 backdrop-blur-sm text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1.5 font-medium">
                            <Shield className="w-3.5 h-3.5 text-success shrink-0" />
                            <span className="text-foreground">We never store your emails</span>
                        </div>
                        <div className="hidden sm:block h-3 w-px bg-border" />
                        <span>We only extract subscription metadata</span>
                        <div className="hidden sm:block h-3 w-px bg-border" />
                        <span>We do not access OTPs or personal messages</span>
                    </div>
                </motion.div>

                {/* Dashboard preview */}
                <motion.div variants={itemVariants} className="w-full">
                    <DashboardPreview />
                </motion.div>
            </motion.div>
        </section>
    );
}
