'use client';

import { useState } from 'react';
import { Home, Users, Calendar, Target, Package, Building2, Settings, Bell, LogOut, User, Plus, X, CheckSquare, MoreHorizontal } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import type { ViewType } from '@/types';

interface NavbarProps {
    view: ViewType;
    onViewChange: (view: ViewType) => void;
    onSignOut: () => void;
    onAddContact: () => void;
    userName?: string;
    userEmail?: string;
    stats: { total: number; leads: number; prospects: number; clients: number; partners: number; collaborateurs?: number; amis?: number; fournisseurs?: number; };
    eventsCount?: number;
    followUpsCount?: number;
}

export function Navbar({ view, onViewChange, onSignOut, onAddContact, userName = 'Utilisateur', userEmail = '', stats, eventsCount = 0, followUpsCount = 0 }: NavbarProps) {
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

    const mainNavItems = [
        { id: 'dashboard' as ViewType, label: 'Accueil', icon: Home },
        { id: 'contacts' as ViewType, label: 'Contacts', icon: Users, badge: stats.total },
        { id: 'events' as ViewType, label: 'Événements', icon: Calendar, badge: eventsCount },
        { id: 'more', label: 'Plus', icon: MoreHorizontal },
    ];

    const moreMenuItems = [
        { id: 'followups' as ViewType, label: 'Relances', icon: CheckSquare, badge: followUpsCount > 0 ? followUpsCount : null },
        { id: 'opportunities' as ViewType, label: 'Opportunités', icon: Target },
        { id: 'offers' as ViewType, label: 'Offres', icon: Package },
        { id: 'enterprise' as ViewType, label: 'Entreprise', icon: Building2 },
        { id: 'settings' as ViewType, label: 'Paramètres', icon: Settings },
    ];

    const handleNavClick = (itemId: string) => { itemId === 'more' ? setShowMoreMenu(true) : onViewChange(itemId as ViewType); };
    const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white lg:hidden">
                <div className="safe-area-bottom relative flex items-end justify-between px-4 pb-3 pt-2">
                    <button onClick={onAddContact} className="absolute left-1/2 top-0 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border-4 border-slate-50 bg-slate-900 text-white transition-colors hover:bg-slate-700 active:bg-slate-800" aria-label="Ajouter un contact">
                        <Plus className="h-6 w-6" />
                    </button>
                    {mainNavItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = view === item.id;
                        return (
                            <button key={item.id} onClick={() => handleNavClick(item.id)}
                                className={`relative flex max-w-[70px] flex-1 flex-col items-center justify-center py-3 transition-colors ${index === 1 ? 'mr-8' : ''} ${index === 2 ? 'ml-8' : ''} ${isActive ? 'text-slate-900' : 'text-slate-500'}`}
                            >
                                <Icon className="h-6 w-6" />
                                <span className={`mt-1 text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="absolute right-2 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-semibold text-white">{item.badge > 9 ? '9+' : item.badge}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* More Menu Modal */}
            {showMoreMenu && (
                <>
                    <div className="fixed inset-0 z-50 bg-black/30 lg:hidden" onClick={() => setShowMoreMenu(false)} />
                    <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-slate-200 bg-white lg:hidden">
                        <div className="sticky top-0 z-10 rounded-t-2xl border-b border-slate-200 bg-white">
                            <div className="flex items-center justify-between p-4">
                                <h3 className="text-lg font-semibold text-slate-900">Menu</h3>
                                <button onClick={() => setShowMoreMenu(false)} className="rounded-full p-2 transition-colors hover:bg-slate-100"><X className="h-5 w-5 text-slate-600" /></button>
                            </div>
                        </div>
                        <div className="p-4 space-y-2">
                            <button onClick={() => { setShowNotifications(true); setShowMoreMenu(false); }} className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-100">
                                        <Bell className="h-5 w-5 text-slate-700" />
                                        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                                    </div>
                                    <div className="text-left"><p className="font-medium text-slate-900">Notifications</p>{unreadCount > 0 && <p className="text-xs text-slate-500">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>}</div>
                                </div>
                            </button>
                            <div className="my-2 h-px bg-slate-200" />
                            {moreMenuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = view === item.id;
                                return (
                                    <button key={item.id} onClick={() => { onViewChange(item.id); setShowMoreMenu(false); }}
                                        className={`flex w-full items-center justify-between rounded-xl p-4 transition-colors ${isActive ? 'border border-slate-300 bg-slate-100 text-slate-900' : 'border border-transparent hover:bg-slate-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${isActive ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-100'}`}><Icon className="h-5 w-5 text-slate-700" /></div>
                                            <span className="font-medium text-slate-900">{item.label}</span>
                                        </div>
                                        {item.badge && <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">{item.badge}</span>}
                                    </button>
                                );
                            })}
                            <div className="my-2 h-px bg-slate-200" />
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-slate-200 font-semibold text-slate-900">{getInitials(userName)}</div>
                                    <div className="flex-1"><p className="font-semibold text-slate-900">{userName}</p><p className="text-sm text-slate-500">{userEmail}</p></div>
                                </div>
                                <button onClick={() => { setShowMoreMenu(false); onViewChange('settings'); }} className="mb-2 flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:bg-slate-100"><User className="h-5 w-5 text-slate-600" /><span className="text-sm font-medium text-slate-700">Mon profil</span></button>
                                <button onClick={() => { setShowMoreMenu(false); onSignOut(); }} className="flex w-full items-center gap-2 rounded-lg border border-red-200 bg-white p-3 text-red-600 transition-colors hover:bg-red-50"><LogOut className="h-5 w-5" /><span className="text-sm font-medium">Déconnexion</span></button>
                            </div>
                        </div>
                        <div className="h-16" />
                    </div>
                </>
            )}

            {/* Notifications Modal */}
            {showNotifications && (
                <>
                    <div className="fixed inset-0 z-50 bg-black/30 lg:hidden" onClick={() => setShowNotifications(false)} />
                    <div className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[80vh] flex-col overflow-hidden rounded-t-2xl border-t border-slate-200 bg-white lg:hidden">
                        <div className="sticky top-0 z-10 rounded-t-2xl border-b border-slate-200 bg-white">
                            <div className="flex items-center justify-between p-4">
                                <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && <button onClick={() => markAllAsRead()} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">Tout marquer</button>}
                                    <button onClick={() => setShowNotifications(false)} className="rounded-full p-2 transition-colors hover:bg-slate-100"><X className="h-5 w-5 text-slate-600" /></button>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center"><Bell className="mx-auto mb-3 h-12 w-12 text-slate-300" /><p className="text-sm text-slate-500">Aucune notification</p></div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {notifications.map((notification) => (
                                        <div key={notification.id} className={`p-4 ${!notification.read ? 'border-l-2 border-slate-900 bg-slate-100/80' : ''}`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notification.priority === 'urgent' ? 'bg-red-500' : notification.priority === 'high' ? 'bg-orange-500' : notification.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className="text-sm font-medium text-slate-900">{notification.title}</h4>
                                                        <button onClick={() => deleteNotification(notification.id)} className="flex-shrink-0 text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
                                                    </div>
                                                    <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                        <span className="text-xs text-slate-400">{new Date(notification.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                                        {!notification.read && <button onClick={() => markAsRead(notification.id)} className="text-xs font-medium text-slate-600 hover:text-slate-900">Marquer comme lu</button>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="h-16" />
                    </div>
                </>
            )}
        </>
    );
}
