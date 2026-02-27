"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Zap,
    Check,
    Lock,
    Flame,
    Sparkles,
    ArrowRight,
    ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePlan } from "@/hooks/usePlan";
import { useProfile } from "@/hooks/useProfile";
import { PLANS } from "@/lib/plans";

function UpgradeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isWelcome = searchParams.get("welcome") === "1";

    const { choosePlan, isPro } = usePlan();
    const { profile, loading } = useProfile();

    const [selecting, setSelecting] = useState<"free" | "pro" | null>(null);
    const [activated, setActivated] = useState(false);

    // If already pro just send to dashboard
    useEffect(() => {
        if (!loading && isPro && !isWelcome) {
            router.replace("/dashboard");
        }
    }, [isPro, loading, isWelcome, router]);

    async function handleChoose(planId: "free" | "pro") {
        setSelecting(planId);
        const ok = await choosePlan(planId);
        if (ok) {
            if (planId === "pro") {
                setActivated(true);
                setTimeout(() => router.push("/dashboard"), 2200);
            } else {
                router.push("/dashboard");
            }
        }
        setSelecting(null);
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="px-6 py-5 flex items-center justify-between border-b border-border">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
                >
                    <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                        <Zap className="w-4 h-4 text-accent-foreground fill-current" />
                    </div>
                    <span className="font-semibold text-foreground">
                        ZeroScribe
                    </span>
                </Link>
                {!isWelcome && (
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Back to dashboard
                    </Link>
                )}
            </header>

            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                {/* Pro activated celebration */}
                <AnimatePresence>
                    {activated && (
                        <motion.div
                            key="activated"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
                        >
                            <div className="text-center p-8 rounded-3xl border border-accent/40 bg-surface-elevated shadow-2xl max-w-sm mx-auto">
                                <div className="text-5xl mb-4">🎉</div>
                                <h2 className="text-2xl font-bold mb-2 text-foreground">
                                    You&apos;re Pro now!
                                </h2>
                                <p className="text-sm text-muted-foreground mb-1">
                                    Welcome to ZeroScribe Pro. Every feature is
                                    unlocked — enjoy it free.
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Taking you to your dashboard…
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Offer banner */}
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-8 px-4 py-2.5 rounded-full bg-accent/10 border border-accent/30 flex items-center gap-2"
                >
                    <Flame className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium text-accent">
                        Launch offer — Pro is free. No card needed.
                    </span>
                </motion.div>

                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className="text-center mb-10 max-w-lg"
                >
                    {isWelcome ? (
                        <>
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                                Welcome,{" "}
                                {profile?.full_name?.split(" ")[0] ?? "there"}!
                                👋
                            </h1>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Choose how you&apos;d like to use ZeroScribe.
                                You can always upgrade later.
                            </p>
                        </>
                    ) : (
                        <>
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                                Unlock Pro — Free
                            </h1>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Get every Pro feature at zero cost during our
                                launch period.
                            </p>
                        </>
                    )}
                </motion.div>

                {/* Plan cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
                    {/* Free plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="relative rounded-2xl border border-border bg-surface p-7 flex flex-col"
                    >
                        <div className="mb-6">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Free
                            </p>
                            <div className="flex items-end gap-1.5 mb-2">
                                <span className="text-4xl font-extrabold tracking-tight">
                                    $0
                                </span>
                                <span className="text-sm text-muted-foreground pb-1.5">
                                    forever
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Basic tracking to get started.
                            </p>
                        </div>

                        <ul className="space-y-2.5 mb-8 flex-1 text-xs">
                            {PLANS.free.features.map((f) => (
                                <li key={f} className="flex items-start gap-2">
                                    <Check className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                                    {f}
                                </li>
                            ))}
                            {PLANS.free.excluded.map((f) => (
                                <li
                                    key={f}
                                    className="flex items-start gap-2 opacity-35 text-muted-foreground"
                                >
                                    <Lock className="w-3 h-3 mt-0.5 shrink-0" />
                                    {f}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleChoose("free")}
                            disabled={selecting !== null}
                            className="w-full py-2.5 text-sm font-medium rounded-xl bg-muted text-foreground hover:bg-muted/80 border border-border transition-all disabled:opacity-60"
                        >
                            {selecting === "free" ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-3.5 h-3.5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                                    Setting up…
                                </span>
                            ) : (
                                "Continue with Free"
                            )}
                        </button>
                    </motion.div>

                    {/* Pro plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="relative rounded-2xl border border-accent/50 bg-surface-elevated glow p-7 flex flex-col"
                    >
                        {/* Badge */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold whitespace-nowrap">
                                <Zap className="w-3 h-3 fill-current" />
                                🔥 Free during launch
                            </span>
                        </div>

                        <div className="mb-6">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Pro
                            </p>
                            <div className="flex items-end gap-1.5 mb-2">
                                <span className="text-4xl font-extrabold tracking-tight text-success">
                                    $0
                                </span>
                                <span className="text-sm text-muted-foreground line-through pb-1.5">
                                    $4/mo
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Everything unlocked. No billing, ever (for now).
                            </p>
                        </div>

                        <ul className="space-y-2.5 mb-8 flex-1 text-xs">
                            {PLANS.pro.features.map((f) => (
                                <li key={f} className="flex items-start gap-2">
                                    <Check className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                                    {f}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleChoose("pro")}
                            disabled={selecting !== null}
                            className="w-full py-2.5 text-sm font-semibold rounded-xl bg-accent text-accent-foreground hover:opacity-90 shadow-lg shadow-accent/25 transition-all disabled:opacity-60"
                        >
                            {selecting === "pro" ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-3.5 h-3.5 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                                    Activating Pro…
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Claim Free Pro Access
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                            )}
                        </button>
                    </motion.div>
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 text-xs text-muted-foreground text-center"
                >
                    No credit card required. Pro is free for early access users
                    — pricing may apply once we exit early access.
                </motion.p>
            </main>
        </div>
    );
}

export default function UpgradePage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <UpgradeContent />
        </Suspense>
    );
}
