'use client';

import { ReactNode } from 'react';

interface HeroProps {
    label?: string;
    children: ReactNode;
    imageUrl: string;
    imageAlt: string;
}

export function Hero({ label, children, imageUrl, imageAlt }: HeroProps) {
    return (
        <section className="relative mb-6 overflow-hidden rounded-[28px] border border-[rgba(201,212,223,0.9)] bg-white px-6 py-5 shadow-[0_24px_48px_rgba(15,35,58,0.08)] lg:px-8 lg:py-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,87,184,0.18),transparent_68%),radial-gradient(circle_at_bottom_left,rgba(83,99,112,0.08),transparent_24%)] lg:bg-[radial-gradient(circle_at_top_left,rgba(0,87,184,0.14),transparent_58%),radial-gradient(circle_at_bottom_left,rgba(83,99,112,0.08),transparent_24%)]" />
            <div className="absolute inset-y-0 right-0 hidden w-[42%] overflow-hidden lg:block">
                <img src={imageUrl} alt={imageAlt} className="h-full w-full object-cover opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/92 to-[#dbe9fb]/55" />
            </div>
            <div className="relative z-10 flex flex-col gap-4 lg:min-h-[200px] lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-4xl space-y-3 lg:space-y-4 lg:pt-2">
                    {label && (
                        <div>
                            <span className="inline-flex rounded-full border border-[rgba(0,87,184,0.14)] bg-[#eef5fe] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0057b8] lg:text-xs">
                                {label}
                            </span>
                        </div>
                    )}
                    <div className="space-y-2">{children}</div>
                    <p className="max-w-2xl text-sm text-slate-600 lg:text-base">Un environnement plus structuré, aligné sur votre identité de marque professionnelle.</p>
                </div>
                {/* <div className="hidden h-24 w-24 items-center justify-center rounded-[24px] border border-white/70 bg-white/80 shadow-[0_18px_32px_rgba(0,87,184,0.12)] backdrop-blur lg:flex">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#0057b8] text-sm font-semibold uppercase tracking-[0.2em] text-white">
                        Sc
                    </div>
                </div> */}
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
                <span className={`${highlightClasses[highlightColor]} inline-flex rounded-xl border px-3 py-1.5 text-2xl font-semibold tracking-tight text-slate-900 lg:text-3xl xl:text-4xl`}>
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
