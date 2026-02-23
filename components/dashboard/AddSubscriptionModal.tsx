"use client";

import { useState, useEffect } from "react";
import { X, Zap } from "lucide-react";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import type { Subscription, SubscriptionFormData, Category } from "@/types";
import { format } from "date-fns";
import { generateServiceLogo } from "@/lib/utils";

interface AddSubscriptionModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: SubscriptionFormData) => Promise<void>;
    categories: Category[];
    editingSubscription?: Subscription | null;
}

const defaultForm: SubscriptionFormData = {
    name: "",
    description: "",
    amount: "",
    currency: "USD",
    billing_cycle: "monthly",
    next_billing_date: format(new Date(), "yyyy-MM-dd"),
    start_date: "",
    status: "active",
    category_id: "",
    website_url: "",
    notes: "",
};

const currencies = [
    { value: "USD", label: "USD — US Dollar" },
    { value: "EUR", label: "EUR — Euro" },
    { value: "GBP", label: "GBP — British Pound" },
    { value: "CAD", label: "CAD — Canadian Dollar" },
    { value: "AUD", label: "AUD — Australian Dollar" },
    { value: "JPY", label: "JPY — Japanese Yen" },
    { value: "INR", label: "INR — Indian Rupee" },
];

const billingCycles = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
];

const statuses = [
    { value: "active", label: "Active" },
    { value: "trial", label: "Trial" },
    { value: "paused", label: "Paused" },
    { value: "cancelled", label: "Cancelled" },
];

export function AddSubscriptionModal({
    open,
    onClose,
    onSubmit,
    categories,
    editingSubscription,
}: AddSubscriptionModalProps) {
    const [form, setForm] = useState<SubscriptionFormData>(defaultForm);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<
        Partial<Record<keyof SubscriptionFormData, string>>
    >({});

    const isEditing = !!editingSubscription;

    useEffect(() => {
        if (editingSubscription) {
            setForm({
                name: editingSubscription.name,
                description: editingSubscription.description || "",
                amount: editingSubscription.amount.toString(),
                currency: editingSubscription.currency,
                billing_cycle: editingSubscription.billing_cycle,
                next_billing_date: editingSubscription.next_billing_date,
                start_date: editingSubscription.start_date || "",
                status: editingSubscription.status,
                category_id: editingSubscription.category_id || "",
                website_url: editingSubscription.website_url || "",
                notes: editingSubscription.notes || "",
            });
        } else {
            setForm(defaultForm);
        }
        setErrors({});
    }, [editingSubscription, open]);

    // Auto-fill logo URL when name changes
    useEffect(() => {
        if (form.name && !editingSubscription?.website_url) {
            const logoUrl = generateServiceLogo(form.name);
            if (logoUrl && !form.website_url) {
                const domain = logoUrl.replace(
                    "https://logo.clearbit.com/",
                    "",
                );
                setForm((prev) => ({
                    ...prev,
                    website_url: `https://${domain}`,
                }));
            }
        }
    }, [form.name, editingSubscription?.website_url, form.website_url]);

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof SubscriptionFormData, string>> =
            {};
        if (!form.name.trim()) newErrors.name = "Name is required";
        if (
            !form.amount ||
            isNaN(parseFloat(form.amount)) ||
            parseFloat(form.amount) <= 0
        ) {
            newErrors.amount = "Enter a valid amount";
        }
        if (!form.next_billing_date)
            newErrors.next_billing_date = "Billing date is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            setLoading(true);
            await onSubmit(form);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const update = (key: keyof SubscriptionFormData, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const categoryOptions = [
        { value: "", label: "No category" },
        ...categories.map((c) => ({ value: c.id, label: c.name })),
    ];

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 8 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md max-h-[90vh] overflow-y-auto"
                    >
                        <div className="bg-surface border border-border rounded-2xl shadow-2xl">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-accent-subtle flex items-center justify-center">
                                        <Zap className="w-3.5 h-3.5 text-accent" />
                                    </div>
                                    <h2 className="text-sm font-semibold">
                                        {isEditing
                                            ? "Edit subscription"
                                            : "Add subscription"}
                                    </h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Form */}
                            <form
                                onSubmit={handleSubmit}
                                className="p-6 space-y-4"
                            >
                                <Input
                                    label="Service name"
                                    placeholder="Netflix, Spotify, GitHub..."
                                    value={form.name}
                                    onChange={(e) =>
                                        update("name", e.target.value)
                                    }
                                    error={errors.name}
                                    autoFocus
                                />

                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="Amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="9.99"
                                        value={form.amount}
                                        onChange={(e) =>
                                            update("amount", e.target.value)
                                        }
                                        error={errors.amount}
                                    />
                                    <Select
                                        label="Currency"
                                        value={form.currency}
                                        onChange={(e) =>
                                            update("currency", e.target.value)
                                        }
                                        options={currencies}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Select
                                        label="Billing cycle"
                                        value={form.billing_cycle}
                                        onChange={(e) =>
                                            update(
                                                "billing_cycle",
                                                e.target.value,
                                            )
                                        }
                                        options={billingCycles}
                                    />
                                    <Select
                                        label="Status"
                                        value={form.status}
                                        onChange={(e) =>
                                            update("status", e.target.value)
                                        }
                                        options={statuses}
                                    />
                                </div>

                                <Input
                                    label="Next billing date"
                                    type="date"
                                    value={form.next_billing_date}
                                    onChange={(e) =>
                                        update(
                                            "next_billing_date",
                                            e.target.value,
                                        )
                                    }
                                    error={errors.next_billing_date}
                                />

                                <Select
                                    label="Category"
                                    value={form.category_id}
                                    onChange={(e) =>
                                        update("category_id", e.target.value)
                                    }
                                    options={categoryOptions}
                                />

                                <Input
                                    label="Website URL"
                                    type="url"
                                    placeholder="https://netflix.com"
                                    value={form.website_url}
                                    onChange={(e) =>
                                        update("website_url", e.target.value)
                                    }
                                />

                                <Textarea
                                    label="Notes"
                                    placeholder="Optional notes..."
                                    value={form.notes}
                                    onChange={(e) =>
                                        update("notes", e.target.value)
                                    }
                                    className="min-h-[60px]"
                                />

                                {/* Actions */}
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={onClose}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        loading={loading}
                                        className="flex-1"
                                    >
                                        {isEditing
                                            ? "Save changes"
                                            : "Add subscription"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
