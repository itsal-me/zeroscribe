"use client";

import { useState } from "react";
import { Plus, ScanLine } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { SubscriptionsList } from "@/components/dashboard/SubscriptionsList";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";
import { AddSubscriptionModal } from "@/components/dashboard/AddSubscriptionModal";
import { Button } from "@/components/ui/Button";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useProfile } from "@/hooks/useProfile";
import type { Subscription } from "@/types";
import toast from "react-hot-toast";

export default function DashboardPage() {
    const {
        subscriptions,
        loading,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        pauseSubscription,
        reactivateSubscription,
    } = useSubscriptions();
    const { categories } = useProfile();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSubscription, setEditingSubscription] =
        useState<Subscription | null>(null);
    const [scanning, setScanning] = useState(false);

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
                `Scan complete! Found ${data.subscriptionsFound} subscription${data.subscriptionsFound !== 1 ? "s" : ""}`,
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

    const upcomingSubscriptions = subscriptions
        .filter((s) => s.status === "active" || s.status === "trial")
        .slice(0, 8);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <DashboardHeader
                title="Dashboard"
                subtitle={
                    loading
                        ? "Loading..."
                        : `${subscriptions.length} subscription${subscriptions.length !== 1 ? "s" : ""} tracked`
                }
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

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
                    {/* Stats */}
                    <StatsGrid subscriptions={subscriptions} />

                    {/* Smart Insights */}
                    <InsightsPanel subscriptions={subscriptions} />

                    {/* Charts */}
                    <SpendingChart subscriptions={subscriptions} />

                    {/* Recent subscriptions */}
                    <div className="bg-surface border border-border rounded-xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                            <div>
                                <h2 className="text-xs font-semibold">
                                    Upcoming renewals
                                </h2>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    Active &amp; trial — next 30 days
                                </p>
                            </div>
                            <a
                                href="/dashboard/subscriptions"
                                className="text-xs text-accent hover:text-accent/80 transition-colors"
                            >
                                View all →
                            </a>
                        </div>
                        <div className="p-2">
                            <SubscriptionsList
                                subscriptions={upcomingSubscriptions}
                                onEdit={handleEdit}
                                onDelete={deleteSubscription}
                                onPause={pauseSubscription}
                                onReactivate={reactivateSubscription}
                                loading={loading}
                                compact
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
