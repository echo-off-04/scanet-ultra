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
        <div className="relative h-[280px] lg:h-[320px] rounded-3xl overflow-hidden mb-8 shadow-2xl">
            <img src={imageUrl} alt={imageAlt} className="w-full h-full object-cover brightness-75" />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 flex flex-col justify-center items-start p-6 lg:p-12">
                <div className="max-w-4xl">
                    {label && (
                        <div className="inline-block mb-3">
                            <span className="px-3 py-1.5 bg-white/95 text-gray-900 text-[10px] lg:text-xs font-bold uppercase tracking-wider rounded-md">
                                {label}
                            </span>
                        </div>
                    )}
                    <div className="space-y-2 lg:space-y-3">{children}</div>
                </div>
            </div>
        </div>
    );
}

interface HeroTextProps {
    children: ReactNode;
    highlight?: boolean;
    highlightColor?: 'blue' | 'purple' | 'green' | 'orange';
}

export function HeroText({ children, highlight = false, highlightColor = 'blue' }: HeroTextProps) {
    const colorClasses = {
        blue: 'bg-blue-400/95',
        purple: 'bg-purple-400/95',
        green: 'bg-emerald-400/95',
        orange: 'bg-orange-400/95',
    };

    if (highlight) {
        return (
            <div className="inline-block">
                <span className={`${colorClasses[highlightColor]} px-3 py-1.5 text-gray-900 text-2xl lg:text-3xl xl:text-4xl font-bold uppercase tracking-tight`}>
                    {children}
                </span>
            </div>
        );
    }

    return (
        <div className="inline-block">
            <span className="text-white text-2xl lg:text-3xl xl:text-4xl font-bold uppercase tracking-tight drop-shadow-2xl">
                {children}
            </span>
        </div>
    );
}
