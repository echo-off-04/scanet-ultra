'use client';

import { ReactNode } from 'react';

interface HeroProps {
    label?: string;
    children: ReactNode;
    imageUrl: string;
    imageAlt: string;
}

export function Hero({ label, children }: HeroProps) {
    return (
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 lg:p-8">
            <div className="max-w-4xl space-y-3">
                {label && (
                    <div>
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 lg:text-xs">
                            {label}
                        </span>
                    </div>
                )}
                <div className="space-y-2">{children}</div>
            </div>
        </section>
    );
}

interface HeroTextProps {
    children: ReactNode;
    highlight?: boolean;
    highlightColor?: 'blue' | 'purple' | 'green' | 'orange';
}

export function HeroText({ children, highlight = false, highlightColor = 'blue' }: HeroTextProps) {
    const highlightClasses = {
        blue: 'border-slate-300 bg-slate-100 text-slate-900',
        purple: 'border-slate-300 bg-slate-100 text-slate-900',
        green: 'border-slate-300 bg-slate-100 text-slate-900',
        orange: 'border-slate-300 bg-slate-100 text-slate-900',
    };

    if (highlight) {
        return (
            <div className="inline-block">
                <span className={`${highlightClasses[highlightColor]} inline-flex rounded-lg border px-3 py-1.5 text-2xl font-semibold tracking-tight text-slate-900 lg:text-3xl xl:text-4xl`}>
                    {children}
                </span>
            </div>
        );
    }

    return (
        <div className="inline-block">
            <span className="text-2xl font-semibold tracking-tight text-slate-900 lg:text-3xl xl:text-4xl">
                {children}
            </span>
        </div>
    );
}
