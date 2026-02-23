import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const manrope = Manrope({
    subsets: ["latin"],
    variable: "--font-manrope",
    display: "swap",
    weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
    title: {
        default: "paySnap — Track every subscription",
        template: "%s | paySnap",
    },
    description:
        "paySnap automatically detects and tracks all your subscriptions through Gmail and manual entry. Know exactly what you're paying, when renewals hit, and never miss a charge again.",
    keywords: [
        "subscription tracker",
        "subscription management",
        "recurring payments",
        "expense tracking",
        "gmail integration",
    ],
    authors: [{ name: "paySnap" }],
    creator: "paySnap",
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://paysnap.app",
        title: "paySnap — Track every subscription",
        description:
            "Automatically detect and manage all your subscriptions in one place.",
        siteName: "paySnap",
    },
    twitter: {
        card: "summary_large_image",
        title: "paySnap",
        description: "Track every subscription automatically.",
        creator: "@paysnap",
    },
    robots: { index: true, follow: true },
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#fafafa" },
        { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    ],
    width: "device-width",
    initialScale: 1,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning className={manrope.variable}>
            <body className="min-h-screen antialiased">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                    <Toaster
                        position="bottom-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: "hsl(var(--surface-elevated))",
                                color: "hsl(var(--foreground))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "10px",
                                fontSize: "13px",
                                fontFamily: "var(--font-manrope)",
                            },
                        }}
                    />
                </ThemeProvider>
            </body>
        </html>
    );
}
