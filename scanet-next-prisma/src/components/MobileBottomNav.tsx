'use client';

import { useState } from 'react';
import { LayoutDashboard, Users, Calendar, MoreHorizontal, Plus, Bell, Settings, Briefcase, Tag, Building2, Mail, Target, LogOut, X } from 'lucide-react';
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
        { id: 'relances' as ViewType, icon: Mail, label: 'Relances', count: followUpsCount },
        { id: 'opportunities' as ViewType, icon: Briefcase, label: 'Opportunités' },
        { id: 'offers' as ViewType, icon: Tag, label: 'Offres' },
        { id: 'objectives' as ViewType, icon: Target, label: 'Objectifs' },
        { id: 'enterprise' as ViewType, icon: Building2, label: 'Entreprise' },
        { id: 'settings' as ViewType, icon: Settings, label: 'Paramètres' },
    ];

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden safe-area-bottom">
                <div className="flex items-center justify-around px-2 py-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-all ${view === item.id ? 'text-[#0E3A5D]' : 'text-gray-400'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    ))}

                    <button
                        onClick={onAddContact}
                        className="flex items-center justify-center w-12 h-12 -mt-4 bg-gradient-to-r from-[#0E3A5D] to-[#1E5A8E] text-white rounded-full shadow-lg"
                    >
                        <Plus className="w-6 h-6" />
                    </button>

                    <button
                        onClick={() => setShowNotifications(true)}
                        className="relative flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg text-gray-400"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                        <span className="text-[10px] font-medium">Notifs</span>
                    </button>

                    <button
                        onClick={() => setShowMoreMenu(true)}
                        className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-all ${showMoreMenu ? 'text-[#0E3A5D]' : 'text-gray-400'
                            }`}
                    >
                        <MoreHorizontal className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Plus</span>
                    </button>
                </div>
            </div>

            {showMoreMenu && (
                <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setShowMoreMenu(false)}>
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0E3A5D] to-[#1E5A8E] flex items-center justify-center text-white font-bold text-lg">
                                {userName?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{userName || 'Utilisateur'}</p>
                                <p className="text-sm text-gray-500">{userEmail}</p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            {moreItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => { onViewChange(item.id); setShowMoreMenu(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === item.id ? 'bg-[#0E3A5D]/10 text-[#0E3A5D]' : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                    {item.count ? (
                                        <span className="ml-auto px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                            {item.count}
                                        </span>
                                    ) : null}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => { setShowMoreMenu(false); onSignOut(); }}
                            className="w-full flex items-center gap-3 px-4 py-3 mt-4 text-red-600 hover:bg-red-50 rounded-xl transition-all border-t border-gray-100 pt-4"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Déconnexion</span>
                        </button>
                    </div>
                </div>
            )}

            {showNotifications && (
                <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={() => setShowNotifications(false)}>
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} className="text-sm text-[#0E3A5D] font-medium">
                                        Tout marquer lu
                                    </button>
                                )}
                                <button onClick={() => setShowNotifications(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {notifications.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">Aucune notification</p>
                        ) : (
                            <div className="space-y-2">
                                {notifications.slice(0, 20).map((notif) => (
                                    <div
                                        key={notif.id}
                                        onClick={() => !notif.read && markAsRead(notif.id)}
                                        className={`p-3 rounded-xl cursor-pointer transition-all ${notif.read ? 'bg-gray-50' : 'bg-blue-50 border border-blue-100'
                                            }`}
                                    >
                                        <p className="font-medium text-sm text-gray-900">{notif.title}</p>
                                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notif.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">
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
