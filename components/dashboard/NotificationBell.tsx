"use client";

import { useState, useRef, useEffect } from "react";
import {
    Bell,
    Check,
    CheckCheck,
    CreditCard,
    Mail,
    AlertTriangle,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import type { NotificationType } from "@/types";

const typeConfig: Record<
    NotificationType,
    { icon: typeof Bell; color: string }
> = {
    renewal_reminder: { icon: AlertTriangle, color: "text-warning" },
    payment_detected: { icon: Mail, color: "text-accent" },
    trial_ending: { icon: CreditCard, color: "text-danger" },
    price_change: { icon: CreditCard, color: "text-orange-400" },
};

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const { notifications, unreadCount, markAsRead, markAllAsRead, loading } =
        useNotifications();

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="relative w-8 h-8 rounded-lg border border-border bg-surface hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-150"
            >
                <Bell className="w-3.5 h-3.5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-danger-foreground text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-10 w-80 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold">
                                    Notifications
                                </span>
                                {unreadCount > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <CheckCheck className="w-3 h-3" />
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* Notification list */}
                        <div className="max-h-80 overflow-y-auto">
                            {loading ? (
                                <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                                    Loading...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="px-4 py-8 text-center">
                                    <Bell className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground">
                                        No notifications yet
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    {notifications.map((notification) => {
                                        const config =
                                            typeConfig[notification.type];
                                        const Icon = config.icon;

                                        return (
                                            <button
                                                key={notification.id}
                                                onClick={() =>
                                                    markAsRead(notification.id)
                                                }
                                                className={cn(
                                                    "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted transition-colors border-b border-border/50 last:border-0",
                                                    !notification.read &&
                                                        "bg-accent-subtle/30",
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                                                        !notification.read
                                                            ? "bg-accent-subtle"
                                                            : "bg-muted",
                                                    )}
                                                >
                                                    <Icon
                                                        className={cn(
                                                            "w-3.5 h-3.5",
                                                            config.color,
                                                        )}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium leading-tight">
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                                                        {formatRelativeDate(
                                                            notification.created_at,
                                                        )}
                                                    </p>
                                                </div>
                                                {!notification.read && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
