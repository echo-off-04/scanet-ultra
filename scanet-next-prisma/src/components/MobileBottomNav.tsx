'use client';

import { useState } from 'react';
import { LayoutDashboard, Users, Calendar, MoreHorizontal, Plus, Bell, Settings, Briefcase, Tag, Building2, Mail, LogOut, X } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import type { ViewType } from '@/types';

interface MobileBottomNavProps {
    view: ViewType;
    onViewChange: (view: ViewType) => void;
    onSignOut: () => void;
    onAddContact: () => void;
    userName?: string;
    userEmail?: string;
    stats: { total: number; leads: number; prospects: number; clients: number; partners: number };
    eventsCount?: number;
    followUpsCount?: number;
}

export function MobileBottomNav({
    view, onViewChange, onSignOut, onAddContact, userName, userEmail,
    stats, eventsCount = 0, followUpsCount = 0
}: MobileBottomNavProps) {
    const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const navItems = [
        { id: 'dashboard' as ViewType, icon: LayoutDashboard, label: 'Accueil' },
        { id: 'contacts' as ViewType, icon: Users, label: 'Contacts' },
        { id: 'events' as ViewType, icon: Calendar, label: 'Événements' },
    ];

    const moreItems = [
        { id: 'followups' as ViewType, icon: Mail, label: 'Relances', count: followUpsCount },
        { id: 'opportunities' as ViewType, icon: Briefcase, label: 'Opportunités' },
        { id: 'offers' as ViewType, icon: Tag, label: 'Offres' },
        { id: 'enterprise' as ViewType, icon: Building2, label: 'Entreprise' },
        { id: 'settings' as ViewType, icon: Settings, label: 'Paramètres' },
    ];

    return (
        <>
            <div className="safe-area-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white md:hidden">
                <div className="flex items-center justify-around px-2 py-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 transition-colors ${view === item.id ? 'text-slate-900' : 'text-slate-400'
                                }`}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    ))}

                    <button
                        onClick={onAddContact}
                        className="-mt-4 flex h-12 w-12 items-center justify-center rounded-xl border-4 border-slate-50 bg-slate-900 text-white"
                    >
                        <Plus className="h-6 w-6" />
                    </button>

                    <button
                        onClick={() => setShowNotifications(true)}
                        className="relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-slate-400"
                    >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                        <span className="text-[10px] font-medium">Notifs</span>
                    </button>

                    <button
                        onClick={() => setShowMoreMenu(true)}
                        className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 transition-colors ${showMoreMenu ? 'text-slate-900' : 'text-slate-400'
                            }`}
                    >
                        <MoreHorizontal className="h-5 w-5" />
                        <span className="text-[10px] font-medium">Plus</span>
                    </button>
                </div>
            </div>

            {showMoreMenu && (
                <div className="fixed inset-0 z-50 bg-black/30 md:hidden" onClick={() => setShowMoreMenu(false)}>
                    <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-slate-200 bg-white p-6" onClick={e => e.stopPropagation()}>
                        <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-slate-300" />
                        <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-lg font-bold text-slate-900">
                                {userName?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">{userName || 'Utilisateur'}</p>
                                <p className="text-sm text-slate-500">{userEmail}</p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            {moreItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => { onViewChange(item.id); setShowMoreMenu(false); }}
                                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors ${view === item.id ? 'border border-slate-300 bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span className="font-medium">{item.label}</span>
                                    {item.count ? (
                                        <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                                            {item.count}
                                        </span>
                                    ) : null}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => { setShowMoreMenu(false); onSignOut(); }}
                            className="mt-4 flex w-full items-center gap-3 rounded-xl border-t border-slate-200 px-4 pb-3 pt-4 text-red-600 transition-colors hover:bg-red-50"
                        >
                            <LogOut className="h-5 w-5" />
                            <span className="font-medium">Déconnexion</span>
                        </button>
                    </div>
                </div>
            )}

            {showNotifications && (
                <div className="fixed inset-0 z-50 bg-black/30 md:hidden" onClick={() => setShowNotifications(false)}>
                    <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-slate-200 bg-white p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} className="text-sm font-medium text-slate-700">
                                        Tout marquer lu
                                    </button>
                                )}
                                <button onClick={() => setShowNotifications(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {notifications.length === 0 ? (
                            <p className="py-8 text-center text-slate-500">Aucune notification</p>
                        ) : (
                            <div className="space-y-2">
                                {notifications.slice(0, 20).map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => !notif.read && markAsRead(notif.id)}
                                        className={`cursor-pointer rounded-xl p-3 transition-colors ${notif.read ? 'bg-slate-50' : 'border border-slate-300 bg-slate-100'
                                            }`}
                                    >
                                        <p className="text-sm font-medium text-slate-900">{notif.title}</p>
                                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{notif.message}</p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            {new Date(notif.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
