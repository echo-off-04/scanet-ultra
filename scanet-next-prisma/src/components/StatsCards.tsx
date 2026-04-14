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
        { label: 'Total Contacts', value: totalContacts, icon: Users, color: 'bg-blue-500', lightBg: 'bg-blue-50', textColor: 'text-blue-600' },
        { label: 'Leads', value: leads, icon: Target, color: 'bg-orange-500', lightBg: 'bg-orange-50', textColor: 'text-orange-600' },
        { label: 'Clients', value: clients, icon: TrendingUp, color: 'bg-emerald-500', lightBg: 'bg-emerald-50', textColor: 'text-emerald-600' },
        { label: 'Partenaires', value: partners, icon: Briefcase, color: 'bg-violet-500', lightBg: 'bg-violet-50', textColor: 'text-violet-600' },
    ];

    const total = totalContacts || 1;
    const segments = [
        { value: leads, color: '#f97316' },
        { value: clients, color: '#10b981' },
        { value: partners, color: '#8b5cf6' },
        { value: Math.max(0, totalContacts - leads - clients - partners), color: '#3b82f6' },
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
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="glass-card p-4 lg:p-5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${stat.lightBg}`}>
                                    <Icon className={`w-5 h-5 ${stat.textColor}`} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Donut chart card */}
                <div className="glass-card p-4 lg:p-5 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-16 h-16">
                        {paths.map((p, i) => (
                            <path key={i} d={p.path} fill="none" stroke={p.color} strokeWidth="8" strokeLinecap="round" />
                        ))}
                        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold fill-gray-700">
                            {totalContacts}
                        </text>
                    </svg>
                </div>
            </div>
        </div>
    );
}
