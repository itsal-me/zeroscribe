"use client";

import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const problems = [
    "Free trials silently convert into paid subscriptions",
    "Price increases go unnoticed month after month",
    "Small monthly charges stack up to hundreds per year",
    "App store subscriptions are only part of the picture",
];

export function Problem() {
    return (
        <section
            id="problem"
            className="py-16 sm:py-24 px-4 border-t border-border"
        >
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-10 sm:mb-14"
                >
                    <p className="text-xs font-semibold uppercase tracking-widest text-danger mb-4">
                        The problem
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-balance">
                        Most people underestimate
                        <br className="hidden sm:block" />
                        their subscription spending
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
                    {problems.map((problem, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -16 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: i * 0.1 }}
                            className="flex items-start gap-3 p-4 rounded-xl bg-danger-subtle/40 border border-danger/20"
                        >
                            <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                            <p className="text-sm text-foreground leading-relaxed">
                                {problem}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-center"
                >
                    <p className="text-base sm:text-lg font-medium text-foreground/80 max-w-2xl mx-auto leading-relaxed">
                        The average user discovers{" "}
                        <span className="text-danger font-bold">
                            1–3 forgotten subscriptions
                        </span>{" "}
                        they had no idea they were still paying for.{" "}
                        <span className="text-muted-foreground">
                            Most of that money is never recovered.
                        </span>
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
