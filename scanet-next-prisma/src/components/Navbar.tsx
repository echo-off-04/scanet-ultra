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
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <div className="relative flex items-end justify-between px-4 pt-2 pb-3 safe-area-bottom">
                    <button onClick={onAddContact} className="absolute left-1/2 -translate-x-1/2 -top-7 w-14 h-14 bg-gradient-to-br from-[#0E3A5D] to-[#1e5a8e] rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform active:scale-95 border-4 border-white z-10" aria-label="Ajouter un contact">
                        <Plus className="w-7 h-7 text-white" />
                    </button>
                    {mainNavItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = view === item.id;
                        return (
                            <button key={item.id} onClick={() => handleNavClick(item.id)}
                                className={`relative flex flex-col items-center justify-center flex-1 max-w-[70px] py-3 transition-all ${index === 1 ? 'mr-8' : ''} ${index === 2 ? 'ml-8' : ''} ${isActive ? 'text-[#0E3A5D]' : 'text-gray-500'}`}
                            >
                                <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                                <span className={`text-[10px] font-medium mt-1 ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="absolute top-0 right-2 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-semibold">{item.badge > 9 ? '9+' : item.badge}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* More Menu Modal */}
            {showMoreMenu && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setShowMoreMenu(false)} />
                    <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 lg:hidden shadow-2xl max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white rounded-t-3xl z-10 border-b border-gray-200">
                            <div className="flex items-center justify-between p-4">
                                <h3 className="text-lg font-bold text-gray-900">Menu</h3>
                                <button onClick={() => setShowMoreMenu(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-600" /></button>
                            </div>
                        </div>
                        <div className="p-4 space-y-2">
                            <button onClick={() => { setShowNotifications(true); setShowMoreMenu(false); }} className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center relative">
                                        <Bell className="w-5 h-5 text-blue-600" />
                                        {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                                    </div>
                                    <div className="text-left"><p className="font-medium text-gray-900">Notifications</p>{unreadCount > 0 && <p className="text-xs text-gray-500">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>}</div>
                                </div>
                            </button>
                            <div className="h-px bg-gray-200 my-2" />
                            {moreMenuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = view === item.id;
                                return (
                                    <button key={item.id} onClick={() => { onViewChange(item.id); setShowMoreMenu(false); }}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${isActive ? 'bg-[#0E3A5D] text-white' : 'hover:bg-gray-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}><Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-700'}`} /></div>
                                            <span className={`font-medium ${isActive ? 'text-white' : 'text-gray-900'}`}>{item.label}</span>
                                        </div>
                                        {item.badge && <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>{item.badge}</span>}
                                    </button>
                                );
                            })}
                            <div className="h-px bg-gray-200 my-2" />
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0E3A5D] to-[#1e5a8e] flex items-center justify-center text-white font-semibold">{getInitials(userName)}</div>
                                    <div className="flex-1"><p className="font-semibold text-gray-900">{userName}</p><p className="text-sm text-gray-500">{userEmail}</p></div>
                                </div>
                                <button onClick={() => { setShowMoreMenu(false); onViewChange('settings'); }} className="w-full flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors mb-2"><User className="w-5 h-5 text-gray-600" /><span className="text-sm font-medium text-gray-700">Mon profil</span></button>
                                <button onClick={() => { setShowMoreMenu(false); onSignOut(); }} className="w-full flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-red-50 transition-colors text-red-600"><LogOut className="w-5 h-5" /><span className="text-sm font-medium">Déconnexion</span></button>
                            </div>
                        </div>
                        <div className="h-16" />
                    </div>
                </>
            )}

            {/* Notifications Modal */}
            {showNotifications && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setShowNotifications(false)} />
                    <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 lg:hidden shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="sticky top-0 bg-white rounded-t-3xl z-10 border-b border-gray-200">
                            <div className="flex items-center justify-between p-4">
                                <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && <button onClick={() => markAllAsRead()} className="text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50">Tout marquer</button>}
                                    <button onClick={() => setShowNotifications(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-600" /></button>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center"><Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm">Aucune notification</p></div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {notifications.map((notification) => (
                                        <div key={notification.id} className={`p-4 ${!notification.read ? 'bg-blue-50/50' : ''}`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notification.priority === 'urgent' ? 'bg-red-500' : notification.priority === 'high' ? 'bg-orange-500' : notification.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className="font-medium text-sm text-gray-900">{notification.title}</h4>
                                                        <button onClick={() => deleteNotification(notification.id)} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><X className="w-4 h-4" /></button>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                        <span className="text-xs text-gray-400">{new Date(notification.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                                        {!notification.read && <button onClick={() => markAsRead(notification.id)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Marquer comme lu</button>}
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
