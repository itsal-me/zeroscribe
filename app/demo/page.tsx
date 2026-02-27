"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { SubscriptionsList } from "@/components/dashboard/SubscriptionsList";
import type { Subscription } from "@/types";

/* ─── Demo Data ──────────────────────────────────────────────────────────── */
function daysFromNow(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
}
function monthsAgo(months: number): string {
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    return d.toISOString();
}

const DEMO_SUBSCRIPTIONS: Subscription[] = [
    {
        id: "demo-1",
        user_id: "demo",
        name: "Netflix",
        description: null,
        amount: 15.99,
        currency: "USD",
        billing_cycle: "monthly",
        next_billing_date: daysFromNow(4),
        start_date: "2024-01-01",
        status: "active",
        category_id: "cat-entertainment",
        logo_url: null,
        website_url: "https://netflix.com",
        notes: null,
        auto_detected: true,
        source: "gmail",
        email_thread_id: null,
        email_sender: "info@netflix.com",
        confidence_score: 95,
        detection_reason: "SENDER_MATCH | AMOUNT_DETECTED | RECURRING_EXPLICIT",
        created_at: monthsAgo(14),
        updated_at: monthsAgo(1),
        categories: { id: "cat-entertainment", user_id: "demo", name: "Entertainment", color: "#E50914", icon: "🎬", is_default: true, created_at: monthsAgo(14) },
    },
    {
        id: "demo-2",
        user_id: "demo",
        name: "Spotify",
        description: null,
        amount: 9.99,
        currency: "USD",
        billing_cycle: "monthly",
        next_billing_date: daysFromNow(11),
        start_date: "2024-02-01",
        status: "active",
        category_id: "cat-entertainment",
        logo_url: null,
        website_url: "https://spotify.com",
        notes: null,
        auto_detected: true,
        source: "gmail",
        email_thread_id: null,
        email_sender: "no-reply@spotify.com",
        confidence_score: 92,
        detection_reason: "SENDER_MATCH | AMOUNT_DETECTED | BILLING_CYCLE_EXPLICIT",
        created_at: monthsAgo(13),
        updated_at: monthsAgo(1),
        categories: { id: "cat-entertainment", user_id: "demo", name: "Entertainment", color: "#E50914", icon: "🎬", is_default: true, created_at: monthsAgo(14) },
    },
    {
        id: "demo-3",
        user_id: "demo",
        name: "Adobe Creative Cloud",
        description: "All apps plan",
        amount: 54.99,
        currency: "USD",
        billing_cycle: "monthly",
        next_billing_date: daysFromNow(18),
        start_date: "2023-11-01",
        status: "active",
        category_id: "cat-productivity",
        logo_url: null,
        website_url: "https://adobe.com",
        notes: null,
        auto_detected: true,
        source: "gmail",
        email_thread_id: null,
        email_sender: "billing@adobe.com",
        confidence_score: 97,
        detection_reason: "SENDER_MATCH | AMOUNT_DETECTED | RECURRING_EXPLICIT | BILLING_CYCLE_EXPLICIT",
        created_at: monthsAgo(15),
        updated_at: monthsAgo(1),
        categories: { id: "cat-productivity", user_id: "demo", name: "Productivity", color: "#FF0000", icon: "💼", is_default: true, created_at: monthsAgo(14) },
    },
    {
        id: "demo-4",
        user_id: "demo",
        name: "GitHub Copilot",
        description: "Individual plan",
        amount: 10.00,
        currency: "USD",
        billing_cycle: "monthly",
        next_billing_date: daysFromNow(3),
        start_date: "2025-09-01",
        status: "trial",
        category_id: "cat-productivity",
        logo_url: null,
        website_url: "https://github.com",
        notes: null,
        auto_detected: true,
        source: "gmail",
        email_thread_id: null,
        email_sender: "noreply@github.com",
        confidence_score: 88,
        detection_reason: "SENDER_MATCH | SUBJECT_BILLING_KW | TRIAL_SIGNAL",
        created_at: monthsAgo(6),
        updated_at: monthsAgo(0),
        categories: { id: "cat-productivity", user_id: "demo", name: "Productivity", color: "#FF0000", icon: "💼", is_default: true, created_at: monthsAgo(14) },
    },
    {
        id: "demo-5",
        user_id: "demo",
        name: "Notion",
        description: "Plus plan",
        amount: 16.00,
        currency: "USD",
        billing_cycle: "monthly",
        next_billing_date: daysFromNow(22),
        start_date: "2024-03-01",
        status: "active",
        category_id: "cat-productivity",
        logo_url: null,
        website_url: "https://notion.so",
        notes: null,
        auto_detected: false,
        source: "manual",
        email_thread_id: null,
        email_sender: null,
        confidence_score: null,
        detection_reason: null,
        created_at: monthsAgo(12),
        updated_at: monthsAgo(2),
        categories: { id: "cat-productivity", user_id: "demo", name: "Productivity", color: "#FF0000", icon: "💼", is_default: true, created_at: monthsAgo(14) },
    },
    {
        id: "demo-6",
        user_id: "demo",
        name: "ChatGPT Plus",
        description: null,
        amount: 20.00,
        currency: "USD",
        billing_cycle: "monthly",
        next_billing_date: daysFromNow(7),
        start_date: "2025-01-01",
        status: "active",
        category_id: "cat-ai",
        logo_url: null,
        website_url: "https://openai.com",
        notes: null,
        auto_detected: true,
        source: "gmail",
        email_thread_id: null,
        email_sender: "billing@openai.com",
        confidence_score: 91,
        detection_reason: "SENDER_MATCH | AMOUNT_DETECTED | RECURRING_EXPLICIT",
        created_at: monthsAgo(14),
        updated_at: monthsAgo(1),
        categories: { id: "cat-ai", user_id: "demo", name: "AI Tools", color: "#10A37F", icon: "🤖", is_default: false, created_at: monthsAgo(14) },
    },
    {
        id: "demo-7",
        user_id: "demo",
        name: "Figma",
        description: "Professional",
        amount: 12.00,
        currency: "USD",
        billing_cycle: "monthly",
        next_billing_date: daysFromNow(9),
        start_date: "2024-05-01",
        status: "active",
        category_id: "cat-design",
        logo_url: null,
        website_url: "https://figma.com",
        notes: null,
        auto_detected: true,
        source: "gmail",
        email_thread_id: null,
        email_sender: "billing@figma.com",
        confidence_score: 89,
        detection_reason: "SENDER_MATCH | SUBJECT_BILLING_KW | AMOUNT_DETECTED",
        created_at: monthsAgo(10),
        updated_at: monthsAgo(1),
        categories: { id: "cat-design", user_id: "demo", name: "Design", color: "#A259FF", icon: "🎨", is_default: false, created_at: monthsAgo(14) },
    },
    {
        id: "demo-8",
        user_id: "demo",
        name: "AWS",
        description: "Monthly compute",
        amount: 34.20,
        currency: "USD",
        billing_cycle: "monthly",
        next_billing_date: daysFromNow(2),
        start_date: "2023-08-01",
        status: "active",
        category_id: "cat-cloud",
        logo_url: null,
        website_url: "https://aws.amazon.com",
        notes: null,
        auto_detected: true,
        source: "gmail",
        email_thread_id: null,
        email_sender: "aws-billing@amazon.com",
        confidence_score: 94,
        detection_reason: "SENDER_MATCH | AMOUNT_DETECTED | RECURRING_EXPLICIT | BILLING_CYCLE_EXPLICIT",
        created_at: monthsAgo(18),
        updated_at: monthsAgo(0),
        categories: { id: "cat-cloud", user_id: "demo", name: "Cloud", color: "#FF9900", icon: "☁️", is_default: false, created_at: monthsAgo(14) },
    },
    {
        id: "demo-9",
        user_id: "demo",
        name: "LinkedIn Premium",
        description: "Career plan",
        amount: 39.99,
        currency: "USD",
        billing_cycle: "monthly",
        next_billing_date: daysFromNow(26),
        start_date: "2023-06-01",
        status: "active",
        category_id: "cat-productivity",
        logo_url: null,
        website_url: "https://linkedin.com",
        notes: null,
        auto_detected: true,
        source: "gmail",
        email_thread_id: null,
        email_sender: "billing@linkedin.com",
        confidence_score: 90,
        detection_reason: "SENDER_MATCH | AMOUNT_DETECTED | RECURRING_EXPLICIT",
        created_at: monthsAgo(20),
        updated_at: monthsAgo(1),
        categories: { id: "cat-productivity", user_id: "demo", name: "Productivity", color: "#FF0000", icon: "💼", is_default: true, created_at: monthsAgo(14) },
    },
    {
        id: "demo-10",
        user_id: "demo",
        name: "Dropbox Plus",
        description: null,
        amount: 9.99,
        currency: "USD",
        billing_cycle: "monthly",
        next_billing_date: daysFromNow(33),
        start_date: "2023-04-01",
        status: "paused",
        category_id: "cat-cloud",
        logo_url: null,
        website_url: "https://dropbox.com",
        notes: "Paused — evaluating alternatives",
        auto_detected: false,
        source: "manual",
        email_thread_id: null,
        email_sender: null,
        confidence_score: null,
        detection_reason: null,
        created_at: monthsAgo(23),
        updated_at: monthsAgo(3),
        categories: { id: "cat-cloud", user_id: "demo", name: "Cloud", color: "#FF9900", icon: "☁️", is_default: false, created_at: monthsAgo(14) },
    },
    {
        id: "demo-11",
        user_id: "demo",
        name: "Disney+",
        description: null,
        amount: 13.99,
        currency: "USD",
        billing_cycle: "monthly",
        next_billing_date: daysFromNow(15),
        start_date: "2024-12-01",
        status: "active",
        category_id: "cat-entertainment",
        logo_url: null,
        website_url: "https://disneyplus.com",
        notes: null,
        auto_detected: true,
        source: "gmail",
        email_thread_id: null,
        email_sender: "disneyplus@mail.disneyplus.com",
        confidence_score: 86,
        detection_reason: "SENDER_MATCH | AMOUNT_DETECTED | BILLING_CYCLE_EXPLICIT",
        created_at: monthsAgo(3),
        updated_at: monthsAgo(1),
        categories: { id: "cat-entertainment", user_id: "demo", name: "Entertainment", color: "#E50914", icon: "🎬", is_default: true, created_at: monthsAgo(14) },
    },
    {
        id: "demo-12",
        user_id: "demo",
        name: "1Password",
        description: "Family plan",
        amount: 4.99,
        currency: "USD",
        billing_cycle: "monthly",
        next_billing_date: daysFromNow(19),
        start_date: "2022-10-01",
        status: "active",
        category_id: "cat-security",
        logo_url: null,
        website_url: "https://1password.com",
        notes: null,
        auto_detected: false,
        source: "manual",
        email_thread_id: null,
        email_sender: null,
        confidence_score: null,
        detection_reason: null,
        created_at: monthsAgo(28),
        updated_at: monthsAgo(4),
        categories: { id: "cat-security", user_id: "demo", name: "Security", color: "#0094F5", icon: "🔐", is_default: false, created_at: monthsAgo(14) },
    },
];

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function DemoPage() {
    const [bannerVisible, setBannerVisible] = useState(true);

    // No-ops for demo — show toast-style feedback
    const noop = async () => {};
    const noopEdit = () => {};

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Demo banner */}
            {bannerVisible && (
                <div className="relative flex items-center justify-center gap-3 bg-accent px-4 py-2.5 text-accent-foreground text-xs font-medium z-50">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>
                        You&apos;re viewing a live demo with sample data.{" "}
                        <Link
                            href="/login"
                            className="underline underline-offset-2 font-semibold hover:opacity-80"
                        >
                            Sign up free to connect your Gmail
                        </Link>
                        .
                    </span>
                    <button
                        onClick={() => setBannerVisible(false)}
                        className="absolute right-3 p-1 rounded-md hover:bg-accent-foreground/10 transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Dashboard shell */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <DashboardHeader
                    title="Dashboard"
                    subtitle={`${DEMO_SUBSCRIPTIONS.length} subscriptions tracked — demo mode`}
                    actions={
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Get Started Free
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    }
                />

                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
                        {/* Stats */}
                        <StatsGrid subscriptions={DEMO_SUBSCRIPTIONS} />

                        {/* Smart Insights */}
                        <InsightsPanel subscriptions={DEMO_SUBSCRIPTIONS} />

                        {/* Charts */}
                        <SpendingChart subscriptions={DEMO_SUBSCRIPTIONS} />

                        {/* Subscription list */}
                        <div className="bg-surface border border-border rounded-xl">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                                <div>
                                    <h2 className="text-xs font-semibold">
                                        All Subscriptions
                                    </h2>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        Sample data — connect Gmail to see yours
                                    </p>
                                </div>
                                <Link
                                    href="/login"
                                    className="text-xs text-accent hover:text-accent/80 transition-colors font-medium"
                                >
                                    Sign up to track yours →
                                </Link>
                            </div>
                            <div className="p-2">
                                <SubscriptionsList
                                    subscriptions={DEMO_SUBSCRIPTIONS}
                                    onEdit={noopEdit}
                                    onDelete={noop}
                                    onPause={noop}
                                    onReactivate={noop}
                                    loading={false}
                                />
                            </div>
                        </div>

                        {/* Bottom CTA */}
                        <div className="text-center py-8 px-6 rounded-2xl border border-border bg-surface-elevated">
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
                                Ready to see your real subscriptions?
                            </h2>
                            <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto leading-relaxed">
                                Connect Gmail and discover every recurring charge
                                in under 30 seconds.
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold bg-accent text-accent-foreground rounded-xl hover:opacity-90 transition-all duration-150 shadow-lg shadow-accent/20"
                            >
                                Analyze My Subscriptions
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <p className="mt-3 text-[11px] text-muted-foreground">
                                Read-only Gmail access. We never send or delete
                                emails.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
