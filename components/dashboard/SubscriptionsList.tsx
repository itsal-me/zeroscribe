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
};

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
                        <span title="Auto-detected from Gmail">
                            <Mail className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                        </span>
                    )}
                </div>
                {!compact && sub.categories && (
                    <span className="text-[10px] text-muted-foreground">
                        {sub.categories.name}
                    </span>
                )}
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
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground transition-all"
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
                                className="absolute right-0 top-8 w-44 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1"
                            >
                                <button
                                    onClick={() => {
                                        onEdit(sub);
                                        setMenuOpen(false);
                                    }}
                                    className="flex items-center gap-2.5 w-full px-3 py-2 text-xs hover:bg-muted transition-colors"
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
                                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs hover:bg-muted transition-colors"
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
                                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs hover:bg-muted transition-colors"
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
                                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs hover:bg-muted transition-colors"
                                    >
                                        <PlayCircle className="w-3.5 h-3.5 text-muted-foreground" />
                                        Reactivate
                                    </button>
                                ) : null}
                                <div className="h-px bg-border my-1" />
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-danger hover:bg-danger-subtle transition-colors disabled:opacity-50"
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
    loading = false,
    compact = false,
}: SubscriptionsListProps) {
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
            {/* Table header */}
            {!compact && (
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
                {subscriptions.map((sub) => (
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
