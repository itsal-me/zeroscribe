"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Filter, ScanLine, X } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SubscriptionsList } from "@/components/dashboard/SubscriptionsList";
import { AddSubscriptionModal } from "@/components/dashboard/AddSubscriptionModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useProfile } from "@/hooks/useProfile";
import type { Subscription, SubscriptionStatus } from "@/types";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const statusFilters: { label: string; value: SubscriptionStatus | "all" }[] = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Trial", value: "trial" },
    { label: "Paused", value: "paused" },
    { label: "Cancelled", value: "cancelled" },
];

export default function SubscriptionsPage() {
    const {
        subscriptions,
        loading,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        pauseSubscription,
        reactivateSubscription,
        approveDetection,
        dismissDetection,
    } = useSubscriptions();
    const { categories } = useProfile();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSubscription, setEditingSubscription] =
        useState<Subscription | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<
        SubscriptionStatus | "all"
    >("all");
    const [scanning, setScanning] = useState(false);

    const filtered = useMemo(() => {
        return subscriptions.filter((s) => {
            // Always surface pending_review items regardless of active filter
            if (s.status === "pending_review") return true;
            const matchesSearch =
                !search ||
                s.name.toLowerCase().includes(search.toLowerCase()) ||
                s.categories?.name
                    ?.toLowerCase()
                    .includes(search.toLowerCase());
            const matchesStatus =
                statusFilter === "all" || s.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [subscriptions, search, statusFilter]);

    const handleEdit = (sub: Subscription) => {
        setEditingSubscription(sub);
        setModalOpen(true);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setEditingSubscription(null);
    };

    const handleSubmit = async (
        formData: Parameters<typeof addSubscription>[0],
    ) => {
        if (editingSubscription) {
            await updateSubscription(editingSubscription.id, formData);
        } else {
            await addSubscription(formData);
        }
    };

    const handleGmailScan = async () => {
        try {
            setScanning(true);
            const res = await fetch("/api/gmail/scan", { method: "POST" });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            toast.success(
                `Found ${data.subscriptionsFound} new subscription${data.subscriptionsFound !== 1 ? "s" : ""}`,
            );
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Scan failed";
            if (msg.includes("Gmail not connected")) {
                toast.error("Connect Gmail in Settings first");
            } else {
                toast.error(msg);
            }
        } finally {
            setScanning(false);
        }
    };

    const counts = {
        all: subscriptions.length,
        active: subscriptions.filter((s) => s.status === "active").length,
        trial: subscriptions.filter((s) => s.status === "trial").length,
        paused: subscriptions.filter((s) => s.status === "paused").length,
        cancelled: subscriptions.filter((s) => s.status === "cancelled").length,
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <DashboardHeader
                title="Subscriptions"
                subtitle={`${filtered.length} of ${subscriptions.length} shown`}
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            loading={scanning}
                            onClick={handleGmailScan}
                            icon={<ScanLine className="w-3.5 h-3.5" />}
                        >
                            <span className="hidden sm:inline">Scan Gmail</span>
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setModalOpen(true)}
                            icon={<Plus className="w-3.5 h-3.5" />}
                        >
                            <span className="hidden sm:inline">Add</span>
                        </Button>
                    </div>
                }
            />

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
                    {/* Filters bar */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search subscriptions..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="input-base pl-9 pr-8"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Status filter pills */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {statusFilters.map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() =>
                                        setStatusFilter(
                                            f.value as
                                                | SubscriptionStatus
                                                | "all",
                                        )
                                    }
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                        statusFilter === f.value
                                            ? "bg-accent text-accent-foreground"
                                            : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80",
                                    )}
                                >
                                    {f.label}
                                    <span className="text-[10px] opacity-70">
                                        {counts[f.value as keyof typeof counts]}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* List */}
                    <div className="bg-surface border border-border rounded-xl">
                        <div className="p-2">
                            <SubscriptionsList
                                subscriptions={filtered}
                                onEdit={handleEdit}
                                onDelete={deleteSubscription}
                                onPause={pauseSubscription}
                                onReactivate={reactivateSubscription}
                                onApprove={approveDetection}
                                onDismiss={dismissDetection}
                                loading={loading}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <AddSubscriptionModal
                open={modalOpen}
                onClose={handleModalClose}
                onSubmit={handleSubmit}
                categories={categories}
                editingSubscription={editingSubscription}
            />
        </div>
    );
}
