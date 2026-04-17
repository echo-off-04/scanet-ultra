'use client';

import { Users, Target, TrendingUp, Briefcase } from 'lucide-react';

interface StatsCardsProps {
    totalContacts: number;
    leads: number;
    clients: number;
    partners: number;
}

export function StatsCards({ totalContacts, leads, clients, partners }: StatsCardsProps) {
    const stats = [
        { label: 'Total Contacts', value: totalContacts, icon: Users },
        { label: 'Leads', value: leads, icon: Target },
        { label: 'Clients', value: clients, icon: TrendingUp },
        { label: 'Partenaires', value: partners, icon: Briefcase },
    ];

    const total = totalContacts || 1;
    const segments = [
        { value: leads, color: '#0057b8' },
        { value: clients, color: '#4dabf5' },
        { value: partners, color: '#90caf9' },
        { value: Math.max(0, totalContacts - leads - clients - partners), color: '#eef5fe' },
    ];

    const createDonutPath = (startAngle: number, endAngle: number, radius: number = 40, cx: number = 50, cy: number = 50) => {
        const start = {
            x: cx + radius * Math.cos(startAngle),
            y: cy + radius * Math.sin(startAngle),
        };
        const end = {
            x: cx + radius * Math.cos(endAngle),
            y: cy + radius * Math.sin(endAngle),
        };
        const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
        return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
    };

    let currentAngle = -Math.PI / 2;
    const paths = segments
        .filter((s) => s.value > 0)
        .map((segment) => {
            const angle = (segment.value / total) * 2 * Math.PI;
            const path = createDonutPath(currentAngle, currentAngle + angle);
            currentAngle += angle;
            return { path, color: segment.color };
        });

    return (
        <div className="mb-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="stat-card">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[rgba(0,87,184,0.12)] bg-[#f4f8fe] text-[#0057b8]">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
                                    <p className="text-xl font-semibold text-slate-900">{stat.value}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Donut chart card */}
                <div className="stat-card flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="h-16 w-16">
                        {paths.map((p, i) => (
                            <path key={i} d={p.path} fill="none" stroke={p.color} strokeWidth="8" strokeLinecap="round" />
                        ))}
                        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="fill-slate-700 text-xs font-semibold">
                            {totalContacts}
                        </text>
                    </svg>
                </div>
            </div>
        </div>
    );
}
