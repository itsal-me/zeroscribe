"use client";

import { useState } from "react";
import {
    MoreHorizontal,
    Edit2,
    Trash2,
    PauseCircle,
    PlayCircle,
    ExternalLink,
    Mail,
    CheckCircle,
    X,
    AlertTriangle,
    Info,
} from "lucide-react";
import {
    cn,
    formatCurrency,
    formatDate,
    getDaysUntilRenewal,
    getBillingCycleLabel,
    getInitials,
} from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { Subscription, SubscriptionStatus } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface SubscriptionsListProps {
    subscriptions: Subscription[];
    onEdit: (subscription: Subscription) => void;
    onDelete: (id: string) => Promise<void>;
    onPause: (id: string) => Promise<void>;
    onReactivate: (id: string) => Promise<void>;
    onApprove?: (id: string) => Promise<void>;
    onDismiss?: (id: string) => Promise<void>;
    loading?: boolean;
    compact?: boolean;
}

const statusVariant: Record<
    SubscriptionStatus,
    "success" | "warning" | "muted" | "danger"
> = {
    active: "success",
    trial: "warning",
    paused: "muted",
    cancelled: "danger",
    pending_review: "warning",
};

// ── Confidence badge ─────────────────────────────────────────────────────────────
function ConfidenceBadge({ score }: { score: number }) {
    const isHigh = score >= 90;
    return (
        <span
            title={`Detection confidence: ${score}%`}
            className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded-full tabular-nums shrink-0",
                isHigh
                    ? "bg-success-subtle text-success"
                    : "bg-warning-subtle text-warning",
            )}
        >
            {score}%
        </span>
    );
}

// ── Pending review card ──────────────────────────────────────────────────────────
function PendingReviewCard({
    sub,
    onApprove,
    onDismiss,
}: {
    sub: Subscription;
    onApprove: (id: string) => Promise<void>;
    onDismiss: (id: string) => Promise<void>;
}) {
    const [busy, setBusy] = useState(false);

    const handle = async (fn: () => Promise<void>) => {
        setBusy(true);
        try {
            await fn();
        } finally {
            setBusy(false);
        }
    };

    const reasons = sub.detection_reason
        ? sub.detection_reason.split(" | ")
        : [];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-xl border border-warning/30 bg-warning-subtle/20 p-4 space-y-3"
        >
            {/* Top row: logo + name + amount + actions */}
            <div className="flex items-center gap-3">
                {sub.logo_url ? (
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted border border-border shrink-0">
                        <Image
                            src={sub.logo_url}
                            alt={sub.name}
                            width={36}
                            height={36}
                            className="w-full h-full object-contain p-0.5"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                    "none";
                            }}
                        />
                    </div>
                ) : (
                    <div className="w-9 h-9 rounded-lg bg-accent-subtle border border-accent/20 flex items-center justify-center text-[11px] font-semibold text-accent shrink-0">
                        {getInitials(sub.name)}
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold">
                            {sub.name}
                        </span>
                        {sub.confidence_score != null && (
                            <ConfidenceBadge score={sub.confidence_score} />
                        )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatCurrency(sub.amount, sub.currency)}/
                        {sub.billing_cycle.slice(0, 2)} &middot; renews{" "}
                        {formatDate(sub.next_billing_date)}
                    </p>
                </div>

                {/* Approve / Dismiss */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        disabled={busy}
                        onClick={() => handle(() => onDismiss(sub.id))}
                        title="Dismiss"
                        className="w-7 h-7 rounded-lg border border-border hover:border-danger/40 hover:bg-danger-subtle flex items-center justify-center text-muted-foreground hover:text-danger transition-colors disabled:opacity-40"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                        disabled={busy}
                        onClick={() => handle(() => onApprove(sub.id))}
                        title="Add to my subscriptions"
                        className="w-7 h-7 rounded-lg border border-success/40 bg-success-subtle hover:bg-success/20 flex items-center justify-center text-success transition-colors disabled:opacity-40"
                    >
                        <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Signal reason pills */}
            {reasons.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                    <Info className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                    {reasons.map((r) => (
                        <span
                            key={r}
                            className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                        >
                            {r}
                        </span>
                    ))}
                </div>
            )}
        </motion.div>
    );
}

function RenewalBadge({ date }: { date: string }) {
    const days = getDaysUntilRenewal(date);
    if (days < 0)
        return (
            <span className="text-[10px] text-danger font-medium">Overdue</span>
        );
    if (days === 0)
        return (
            <span className="text-[10px] text-danger font-medium">Today</span>
        );
    if (days === 1)
        return (
            <span className="text-[10px] text-warning font-medium">
                Tomorrow
            </span>
        );
    if (days <= 7)
        return (
            <span className="text-[10px] text-warning font-medium">
                In {days}d
            </span>
        );
    return (
        <span className="text-[10px] text-muted-foreground">
            {formatDate(date)}
        </span>
    );
}

function SubscriptionRow({
    sub,
    onEdit,
    onDelete,
    onPause,
    onReactivate,
    compact,
}: {
    sub: Subscription;
    onEdit: (s: Subscription) => void;
    onDelete: (id: string) => Promise<void>;
    onPause: (id: string) => Promise<void>;
    onReactivate: (id: string) => Promise<void>;
    compact?: boolean;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await onDelete(sub.id);
        } finally {
            setDeleting(false);
            setMenuOpen(false);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
                "flex items-center gap-3 px-4 rounded-xl border border-transparent hover:border-border hover:bg-surface-elevated transition-all duration-150 group relative",
                compact ? "py-2.5" : "py-3",
            )}
        >
            {/* Logo / Avatar */}
            <div className="shrink-0">
                {sub.logo_url ? (
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted border border-border">
                        <Image
                            src={sub.logo_url}
                            alt={sub.name}
                            width={32}
                            height={32}
                            className="w-full h-full object-contain p-0.5"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                    "none";
                            }}
                        />
                    </div>
                ) : (
                    <div className="w-8 h-8 rounded-lg bg-accent-subtle border border-accent/20 flex items-center justify-center text-[11px] font-semibold text-accent">
                        {getInitials(sub.name)}
                    </div>
                )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium truncate">
                        {sub.name}
                    </span>
                    {sub.auto_detected && (
                        <span
                            title="Auto-detected from Gmail"
                            className="flex items-center gap-1"
                        >
                            <Mail className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                            {sub.confidence_score != null && (
                                <ConfidenceBadge score={sub.confidence_score} />
                            )}
                        </span>
                    )}
                </div>
                {!compact && sub.categories && (
                    <span className="text-[10px] text-muted-foreground">
                        {sub.categories.name}
                    </span>
                )}
                {/* Renewal date shown inline on mobile */}
                <div className="sm:hidden mt-0.5">
                    <RenewalBadge date={sub.next_billing_date} />
                </div>
            </div>

            {/* Renewal date */}
            <div className="hidden sm:block text-right shrink-0 w-20">
                <RenewalBadge date={sub.next_billing_date} />
                {!compact && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {getBillingCycleLabel(sub.billing_cycle)}
                    </p>
                )}
            </div>

            {/* Status */}
            {!compact && (
                <div className="hidden md:block shrink-0">
                    <Badge variant={statusVariant[sub.status]} dot>
                        {sub.status}
                    </Badge>
                </div>
            )}

            {/* Amount */}
            <div className="text-right shrink-0">
                <span className="text-sm font-semibold">
                    {formatCurrency(sub.amount, sub.currency)}
                </span>
                {!compact && (
                    <p className="text-[10px] text-muted-foreground/60">
                        /{sub.billing_cycle.slice(0, 2)}
                    </p>
                )}
            </div>

            {/* Actions menu */}
            <div className="relative shrink-0">
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="sm:opacity-0 sm:group-hover:opacity-100 opacity-100 w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground transition-all"
                >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                </button>

                <AnimatePresence>
                    {menuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setMenuOpen(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                transition={{ duration: 0.12 }}
                                className="absolute right-0 top-8 w-48 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1"
                            >
                                <button
                                    onClick={() => {
                                        onEdit(sub);
                                        setMenuOpen(false);
                                    }}
                                    className="flex items-center gap-2.5 w-full px-3 py-3 sm:py-2 text-xs hover:bg-muted transition-colors"
                                >
                                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                                    Edit
                                </button>
                                {sub.website_url && (
                                    <a
                                        href={sub.website_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center gap-2.5 w-full px-3 py-3 sm:py-2 text-xs hover:bg-muted transition-colors"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                                        Visit website
                                    </a>
                                )}
                                {sub.status === "active" ? (
                                    <button
                                        onClick={() => {
                                            onPause(sub.id);
                                            setMenuOpen(false);
                                        }}
                                        className="flex items-center gap-2.5 w-full px-3 py-3 sm:py-2 text-xs hover:bg-muted transition-colors"
                                    >
                                        <PauseCircle className="w-3.5 h-3.5 text-muted-foreground" />
                                        Pause
                                    </button>
                                ) : sub.status === "paused" ? (
                                    <button
                                        onClick={() => {
                                            onReactivate(sub.id);
                                            setMenuOpen(false);
                                        }}
                                        className="flex items-center gap-2.5 w-full px-3 py-3 sm:py-2 text-xs hover:bg-muted transition-colors"
                                    >
                                        <PlayCircle className="w-3.5 h-3.5 text-muted-foreground" />
                                        Reactivate
                                    </button>
                                ) : null}
                                <div className="h-px bg-border my-1" />
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex items-center gap-2.5 w-full px-3 py-3 sm:py-2 text-xs text-danger hover:bg-danger-subtle transition-colors disabled:opacity-50"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {deleting ? "Removing..." : "Remove"}
                                </button>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

export function SubscriptionsList({
    subscriptions,
    onEdit,
    onDelete,
    onPause,
    onReactivate,
    onApprove,
    onDismiss,
    loading = false,
    compact = false,
}: SubscriptionsListProps) {
    const pending = subscriptions.filter((s) => s.status === "pending_review");
    const regular = subscriptions.filter((s) => s.status !== "pending_review");

    if (loading) {
        return (
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="h-12 rounded-xl bg-muted animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (subscriptions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <Mail className="w-5 h-5 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium mb-1">No subscriptions yet</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                    Add your first subscription manually or connect Gmail to
                    auto-detect them.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-0.5">
            {/* ── Pending review section ─────────────────────────────── */}
            {pending.length > 0 && onApprove && onDismiss && (
                <div className="mb-4 space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
                        <span className="text-xs font-semibold">
                            Review detected subscriptions
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full bg-warning-subtle text-warning text-[10px] font-semibold">
                            {pending.length}
                        </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground px-1">
                        These were found in your Gmail with moderate confidence.
                        Accept ones that are genuine, dismiss the rest.
                    </p>
                    <AnimatePresence>
                        {pending.map((sub) => (
                            <PendingReviewCard
                                key={sub.id}
                                sub={sub}
                                onApprove={onApprove}
                                onDismiss={onDismiss}
                            />
                        ))}
                    </AnimatePresence>
                    {regular.length > 0 && (
                        <div className="h-px bg-border my-2" />
                    )}
                </div>
            )}

            {/* ── Regular subscription table ────────────────────────────── */}
            {!compact && regular.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    <div className="w-8 shrink-0" />
                    <div className="flex-1">Name</div>
                    <div className="hidden sm:block w-20 text-right">
                        Renewal
                    </div>
                    <div className="hidden md:block">Status</div>
                    <div className="text-right">Amount</div>
                    <div className="w-6 shrink-0" />
                </div>
            )}

            <AnimatePresence>
                {regular.map((sub) => (
                    <SubscriptionRow
                        key={sub.id}
                        sub={sub}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onPause={onPause}
                        onReactivate={onReactivate}
                        compact={compact}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}
