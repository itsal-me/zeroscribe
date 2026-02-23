import Link from "next/link";
import { Zap } from "lucide-react";

const links = {
    Product: ["Features", "Pricing", "Changelog", "Roadmap"],
    Company: ["About", "Blog", "Careers", "Press"],
    Legal: ["Privacy", "Terms", "Security", "Cookie Policy"],
};

export function Footer() {
    return (
        <footer className="border-t border-border py-16 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
                    {/* Brand */}
                    <div className="col-span-2 sm:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
                                <Zap className="w-3.5 h-3.5 text-accent-foreground fill-current" />
                            </div>
                            <span className="text-sm font-semibold">
                                paySnap
                            </span>
                        </Link>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-[180px]">
                            Track every subscription. Automatically,
                            beautifully.
                        </p>
                    </div>

                    {/* Links */}
                    {Object.entries(links).map(([category, items]) => (
                        <div key={category}>
                            <p className="text-xs font-semibold text-foreground mb-3">
                                {category}
                            </p>
                            <ul className="space-y-2">
                                {items.map((item) => (
                                    <li key={item}>
                                        <a
                                            href="#"
                                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} paySnap. All rights
                        reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        <a
                            href="#"
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Twitter
                        </a>
                        <a
                            href="#"
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            GitHub
                        </a>
                        <a
                            href="#"
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Discord
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
