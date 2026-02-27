"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handler, { passive: true });
        return () => window.removeEventListener("scroll", handler);
    }, []);

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                scrolled
                    ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm"
                    : "bg-transparent",
            )}
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                        <Zap className="w-4 h-4 text-accent-foreground fill-current" />
                    </div>
                    <span className="text-sm font-semibold tracking-tight">
                        paySnap
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="nav-link text-xs font-medium"
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                {/* Right side */}
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Link
                        href="/demo"
                        className="hidden md:inline-flex items-center px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                        Try Demo
                    </Link>
                    <Link
                        href="/login"
                        className="hidden md:inline-flex items-center px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Sign in
                    </Link>
                    <Link
                        href="/login"
                        className="hidden md:inline-flex items-center px-3.5 py-1.5 text-xs font-semibold bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Get started
                    </Link>
                    <button
                        className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        {mobileOpen ? (
                            <X className="w-4 h-4" />
                        ) : (
                            <Menu className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border overflow-hidden"
                    >
                        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
                            {navLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <div className="pt-2 border-t border-border mt-2 flex flex-col gap-2">
                                <Link
                                    href="/login"
                                    onClick={() => setMobileOpen(false)}
                                    className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/demo"
                                    onClick={() => setMobileOpen(false)}
                                    className="px-3 py-2 text-sm font-medium text-foreground border border-border rounded-lg text-center hover:bg-muted transition-colors"
                                >
                                    Try Demo
                                </Link>
                                <Link
                                    href="/login"
                                    onClick={() => setMobileOpen(false)}
                                    className="px-3 py-2 text-sm font-semibold bg-accent text-accent-foreground rounded-lg text-center hover:opacity-90 transition-opacity"
                                >
                                    Get started free
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
