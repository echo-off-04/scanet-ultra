'use client';

import { DollarSign, Users, UserPlus, Trophy, Calendar, Target, MoreVertical, Pencil, Trash2, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { formatCurrency } from '@/lib/currency';
import {
    type PersonalObjective,
    getObjectiveProgress,
    OBJECTIVE_TYPE_CONFIG,
    CONTACT_STATUS_LABELS,
    PERIOD_LABELS,
} from '@/lib/objectiveCalculator';

interface ObjectiveProgressCardProps {
    objective: PersonalObjective;
    onEdit: (objective: PersonalObjective) => void;
    onDelete: (id: string) => void;
    onReactivate: (id: string) => void;
}

const ICONS: Record<string, typeof Target> = { DollarSign, Users, UserPlus, Trophy, Calendar };

export function ObjectiveProgressCard({ objective, onEdit, onDelete, onReactivate }: ObjectiveProgressCardProps) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const progress = getObjectiveProgress(objective);
    const config = OBJECTIVE_TYPE_CONFIG[objective.objectiveType];
    const Icon = ICONS[config.icon] || Target;
    const isAchieved = objective.status === 'achieved';

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatValue = (value: number) => {
        if (objective.unit === 'currency') return formatCurrency(value, objective.currency);
        if (objective.unit === 'percentage') return `${Math.round(value)}%`;
        return Math.round(value).toString();
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getSubtitle = () => {
        const parts: string[] = [];
        if (objective.objectiveType === 'contacts_by_status' && objective.contactStatusFilter) {
            parts.push(CONTACT_STATUS_LABELS[objective.contactStatusFilter] || objective.contactStatusFilter);
        }
        if (objective.periodType === 'custom' && objective.periodStart && objective.periodEnd) {
            parts.push(`${formatDate(objective.periodStart as unknown as string)} - ${formatDate(objective.periodEnd as unknown as string)}`);
        } else if (PERIOD_LABELS[objective.periodType]) {
            parts.push(PERIOD_LABELS[objective.periodType]);
        }
        return parts.join(' - ');
    };

    const getProgressColor = () => {
        if (isAchieved) return '#10b981';
        if (progress >= 75) return config.color;
        if (progress >= 50) return '#f59e0b';
        if (progress >= 25) return '#f97316';
        return '#ef4444';
    };

    const progressColor = getProgressColor();

    return (
        <div className="group relative rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50">
            {isAchieved && (
                <div className="absolute -top-2 -right-2 z-10">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900"><CheckCircle2 className="h-4 w-4 text-white" /></div>
                </div>
            )}

            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                        <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-slate-900">{objective.title}</h4>
                        <p className="truncate text-xs text-slate-500">{getSubtitle()}</p>
                    </div>
                </div>

                <div className="relative" ref={menuRef}>
                    <button onClick={() => setShowMenu(!showMenu)} className="rounded-lg p-1 opacity-0 transition-colors group-hover:opacity-100 hover:bg-slate-100"><MoreVertical className="h-4 w-4 text-slate-400" /></button>
                    {showMenu && (
                        <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <button onClick={() => { onEdit(objective); setShowMenu(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><Pencil className="h-3.5 w-3.5" /> Modifier</button>
                            {isAchieved && <button onClick={() => { onReactivate(objective.id); setShowMenu(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><RotateCcw className="h-3.5 w-3.5" /> Réactiver</button>}
                            <button onClick={() => { onDelete(objective.id); setShowMenu(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Supprimer</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-end justify-between mb-2">
                <div>
                    <span className="text-xl font-semibold text-slate-900">{formatValue(objective.currentValue)}</span>
                    <span className="ml-1 text-sm text-slate-400">/ {formatValue(objective.targetValue)}</span>
                </div>
                <span className="text-sm font-semibold text-slate-700">{progress}%</span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-slate-700 transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
            </div>

            {objective.priority === 'high' && !isAchieved && (
                <div className="mt-2 flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-slate-500" /><span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Priorité haute</span></div>
            )}

            {isAchieved && objective.achievedAt && (
                <div className="mt-2"><span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Atteint le {new Date(objective.achievedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
            )}
        </div>
    );
}
