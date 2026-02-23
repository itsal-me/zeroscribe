"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/Button";
import { useProfile } from "@/hooks/useProfile";
import {
    Mail,
    Unlink,
    ScanLine,
    CheckCircle,
    AlertCircle,
    Bell,
    User,
    Shield,
} from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

function SettingSection({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-surface border border-border rounded-xl p-5">
            <div className="mb-5">
                <h3 className="text-xs font-semibold">{title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {description}
                </p>
            </div>
            {children}
        </div>
    );
}

export default function SettingsPage() {
    const { profile, loading, updateProfile, disconnectGmail } = useProfile();
    const [scanning, setScanning] = useState(false);
    const [notifDays, setNotifDays] = useState(3);
    const [notifEmail, setNotifEmail] = useState(true);
    const [saving, setSaving] = useState(false);
    const searchParams = useSearchParams();

    useEffect(() => {
        if (profile) {
            setNotifDays(profile.notification_days_before ?? 3);
            setNotifEmail(profile.notification_email ?? true);
        }
    }, [profile]);

    useEffect(() => {
        if (searchParams.get("gmail_connected") === "true") {
            toast.success("Gmail connected successfully!");
        }
        if (searchParams.get("gmail_error")) {
            toast.error(
                `Gmail connection failed: ${searchParams.get("gmail_error")}`,
            );
        }
    }, [searchParams]);

    const handleConnectGmail = () => {
        window.location.href = "/api/gmail/connect";
    };

    const handleDisconnectGmail = async () => {
        await disconnectGmail();
        toast.success("Gmail disconnected");
    };

    const handleScanGmail = async () => {
        try {
            setScanning(true);
            const res = await fetch("/api/gmail/scan", { method: "POST" });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            toast.success(
                `Scan complete! Found ${data.subscriptionsFound} new subscription${data.subscriptionsFound !== 1 ? "s" : ""}`,
            );
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Scan failed");
        } finally {
            setScanning(false);
        }
    };

    const handleSaveNotifications = async () => {
        setSaving(true);
        const err = await updateProfile({
            notification_days_before: notifDays,
            notification_email: notifEmail,
        });
        if (err) {
            toast.error("Failed to save settings");
        } else {
            toast.success("Settings saved");
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col h-full overflow-hidden">
                <DashboardHeader title="Settings" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <DashboardHeader
                title="Settings"
                subtitle="Manage your account and integrations"
            />

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
                    {/* Profile */}
                    <SettingSection
                        title="Profile"
                        description="Your account information"
                    >
                        <div className="flex items-center gap-4">
                            {profile?.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={profile.avatar_url}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full object-cover border border-border"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-accent-subtle border border-accent/20 flex items-center justify-center">
                                    <User className="w-5 h-5 text-accent" />
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium">
                                    {profile?.full_name || "User"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {profile?.email}
                                </p>
                            </div>
                        </div>
                    </SettingSection>

                    {/* Gmail Integration */}
                    <SettingSection
                        title="Gmail integration"
                        description="Auto-detect subscriptions from your Gmail inbox"
                    >
                        {profile?.gmail_connected ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-success-subtle border border-success/20">
                                    <CheckCircle className="w-4 h-4 text-success shrink-0" />
                                    <div>
                                        <p className="text-xs font-medium text-success">
                                            Gmail connected
                                        </p>
                                        {profile.gmail_last_scanned && (
                                            <p className="text-[10px] text-success/70 mt-0.5">
                                                Last scanned{" "}
                                                {formatRelativeDate(
                                                    profile.gmail_last_scanned,
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        loading={scanning}
                                        onClick={handleScanGmail}
                                        icon={
                                            <ScanLine className="w-3.5 h-3.5" />
                                        }
                                    >
                                        Scan now
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={handleDisconnectGmail}
                                        icon={
                                            <Unlink className="w-3.5 h-3.5" />
                                        }
                                    >
                                        Disconnect
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted border border-border">
                                    <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Connect Gmail to automatically detect
                                        subscriptions from receipts and billing
                                        emails. We only request read-only
                                        access.
                                    </p>
                                </div>

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleConnectGmail}
                                    icon={<Mail className="w-3.5 h-3.5" />}
                                >
                                    Connect Gmail
                                </Button>
                            </div>
                        )}
                    </SettingSection>

                    {/* Notifications */}
                    <SettingSection
                        title="Notifications"
                        description="Configure renewal reminders and alerts"
                    >
                        <div className="space-y-5">
                            {/* Email notifications toggle */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium">
                                        Email reminders
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Receive email alerts before renewals
                                    </p>
                                </div>
                                <button
                                    onClick={() => setNotifEmail(!notifEmail)}
                                    className={cn(
                                        "relative w-9 h-5 rounded-full transition-colors duration-200",
                                        notifEmail
                                            ? "bg-accent"
                                            : "bg-muted border border-border",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200",
                                            notifEmail
                                                ? "left-[18px]"
                                                : "left-0.5",
                                        )}
                                    />
                                </button>
                            </div>

                            {/* Days before */}
                            <div>
                                <p className="text-xs font-medium mb-2">
                                    Remind me
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {[1, 3, 5, 7, 14].map((days) => (
                                        <button
                                            key={days}
                                            onClick={() => setNotifDays(days)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                                notifDays === days
                                                    ? "bg-accent text-accent-foreground"
                                                    : "bg-muted text-muted-foreground hover:text-foreground",
                                            )}
                                        >
                                            {days} day{days !== 1 ? "s" : ""}{" "}
                                            before
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                size="sm"
                                loading={saving}
                                onClick={handleSaveNotifications}
                            >
                                Save preferences
                            </Button>
                        </div>
                    </SettingSection>

                    {/* Security */}
                    <SettingSection
                        title="Security & privacy"
                        description="Data security information"
                    >
                        <div className="space-y-3">
                            {[
                                "All data encrypted at rest with AES-256",
                                "Row-level security — your data is never accessible to other users",
                                "Gmail access is read-only and can be revoked at any time",
                                "OAuth tokens are stored encrypted in your private database",
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="flex items-start gap-2.5"
                                >
                                    <Shield className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                                    <p className="text-xs text-muted-foreground">
                                        {item}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </SettingSection>

                    {/* Danger zone */}
                    <div className="bg-danger-subtle border border-danger/20 rounded-xl p-5">
                        <h3 className="text-xs font-semibold text-danger mb-1">
                            Danger zone
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Permanently delete your account and all associated
                            data.
                        </p>
                        <Button variant="danger" size="sm" disabled>
                            Delete account
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
