"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Zap, Mail, ArrowRight, Shield, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

function LoginForm() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const searchParams = useSearchParams();
    const router = useRouter();

    // Read error passed back from the OAuth callback redirect
    useEffect(() => {
        const urlError = searchParams.get("error");
        if (urlError) {
            setError(decodeURIComponent(urlError));
            // Clean the URL so refreshing doesn't re-show the error
            router.replace("/login", { scroll: false });
        }
    }, [searchParams, router]);

    const supabase = createClient();

    async function handleGoogleSignIn() {
        try {
            setLoading(true);
            setError("");
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        access_type: "offline",
                        prompt: "consent",
                    },
                },
            });
            if (error) throw error;
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Failed to sign in. Please try again.";
            setError(message);
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Background */}
            <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 px-6 py-5">
                <Link href="/" className="inline-flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                        <Zap className="w-4 h-4 text-accent-foreground fill-current" />
                    </div>
                    <span className="text-sm font-semibold">paySnap</span>
                </Link>
            </header>

            {/* Main content */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 sm:py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-sm"
                >
                    {/* Card */}
                    <div className="bg-surface border border-border rounded-2xl p-5 sm:p-8 shadow-xl">
                        {/* Header */}
                        <div className="text-center mb-5 sm:mb-8">
                            <h1 className="text-xl font-bold tracking-tight mb-2">
                                Welcome back
                            </h1>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Sign in to manage all your subscriptions in one
                                place.
                            </p>
                        </div>

                        {/* Google sign-in */}
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-surface-elevated border border-border rounded-xl text-sm font-medium hover:bg-muted transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <svg
                                    className="w-4 h-4 shrink-0"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                            )}
                            <span>
                                {loading
                                    ? "Signing in..."
                                    : "Continue with Google"}
                            </span>
                            {!loading && (
                                <ArrowRight className="w-3.5 h-3.5 ml-auto text-muted-foreground group-hover:text-foreground transition-colors" />
                            )}
                        </button>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="mt-4 flex items-start gap-2.5 bg-danger/10 border border-danger/20 rounded-xl px-3 py-2.5"
                                >
                                    <AlertCircle className="w-3.5 h-3.5 text-danger shrink-0 mt-0.5" />
                                    <p className="text-xs text-danger leading-relaxed">
                                        {error}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-surface px-3 text-xs text-muted-foreground">
                                    More options coming soon
                                </span>
                            </div>
                        </div>

                        {/* Email placeholder */}
                        <button
                            disabled
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-muted/50 border border-border/50 rounded-xl text-sm font-medium text-muted-foreground cursor-not-allowed opacity-50"
                        >
                            <Mail className="w-4 h-4" />
                            Continue with email
                        </button>
                    </div>

                    {/* Security note */}
                    <div className="mt-4 sm:mt-6 flex items-start gap-2.5 px-1">
                        <Shield className="w-3.5 h-3.5 text-muted-foreground/60 mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground/70 leading-relaxed">
                            We use Google OAuth for secure, passwordless
                            sign-in. Gmail access is read-only and can be
                            revoked anytime.
                        </p>
                    </div>

                    {/* Back link */}
                    <p className="text-center text-xs text-muted-foreground mt-6">
                        <Link
                            href="/"
                            className="hover:text-foreground transition-colors"
                        >
                            ← Back to home
                        </Link>
                    </p>
                </motion.div>
            </main>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}
