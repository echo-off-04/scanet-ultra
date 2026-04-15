'use client';

import { useState, useEffect } from 'react';
import {
    Users, Calendar, CheckSquare, Filter, LogOut,
    ChevronLeft, ChevronRight, Target, Settings,
    Home, ChevronDown, ChevronUp, User, Package, Building2, Bell, X, Check
} from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import type { ViewType } from '@/types';

interface SidebarProps {
    view: ViewType;
    onViewChange: (view: ViewType) => void;
    filterStatus: string;
    onFilterChange: (status: string) => void;
    onSignOut: () => void;
    stats: {
        total: number; leads: number; prospects: number; clients: number; partners: number;
        collaborateurs?: number; amis?: number; fournisseurs?: number;
    };
    eventsCount?: number;
    followUpsCount?: number;
    userName?: string;
    userEmail?: string;
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

export function Sidebar({
    view, onViewChange, filterStatus, onFilterChange, onSignOut, stats,
    eventsCount = 0, followUpsCount = 0, userName = 'Utilisateur', userEmail = '',
    isMobileOpen = false, onMobileClose,
}: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showFilters, setShowFilters] = useState(true);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        const isMobile = window.innerWidth < 1024;
        if (saved !== null && !isMobile) setIsCollapsed(JSON.parse(saved));
    }, []);

    const toggleCollapsed = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    };

    const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

    const menuItems = [
        { id: 'dashboard' as ViewType, label: 'Tableau de bord', icon: Home, count: null },
        { id: 'contacts' as ViewType, label: 'Contacts', icon: Users, count: stats.total },
        { id: 'events' as ViewType, label: 'Événements', icon: Calendar, count: eventsCount },
        { id: 'followups' as ViewType, label: 'Relances', icon: CheckSquare, count: followUpsCount, badge: followUpsCount > 0 },
        { id: 'opportunities' as ViewType, label: 'Opportunités', icon: Target, count: null },
        { id: 'offers' as ViewType, label: 'Offres', icon: Package, count: null },
        { id: 'enterprise' as ViewType, label: 'Entreprise', icon: Building2, count: null },
    ];

    const filterOptions = [
        { value: 'all', label: 'Tous les contacts', count: stats.total, color: 'bg-slate-100 text-slate-700' },
        { value: 'lead', label: 'Leads', count: stats.leads, color: 'bg-slate-100 text-slate-700' },
        { value: 'prospect', label: 'Prospects', count: stats.prospects, color: 'bg-slate-100 text-slate-700' },
        { value: 'client', label: 'Clients', count: stats.clients, color: 'bg-slate-100 text-slate-700' },
        { value: 'partner', label: 'Partenaires', count: stats.partners, color: 'bg-slate-100 text-slate-700' },
        { value: 'collaborateur', label: 'Collaborateurs', count: stats.collaborateurs || 0, color: 'bg-slate-100 text-slate-700' },
        { value: 'ami', label: 'Ami(e)s', count: stats.amis || 0, color: 'bg-slate-100 text-slate-700' },
        { value: 'fournisseur', label: 'Fournisseurs', count: stats.fournisseurs || 0, color: 'bg-slate-100 text-slate-700' },
    ];

    return (
        <aside className={`relative hidden h-screen flex-col border-r border-slate-200 bg-slate-50 transition-all duration-200 ease-in-out lg:flex ${isCollapsed ? 'w-16 lg:w-20' : 'w-72'}`}>
            {/* Header */}
            <div className={`border-b border-slate-200 ${isCollapsed ? 'p-2' : 'p-5'}`}>
                <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-900">
                            S
                        </div>
                        {!isCollapsed && (
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Scanet</p>
                                <p className="text-xs text-slate-500">Navigation</p>
                            </div>
                        )}
                    </div>
                    {!isCollapsed && (
                        <button onClick={toggleCollapsed} className="hidden rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 lg:block" title="Réduire la sidebar">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                    )}
                </div>
                {isCollapsed && (
                    <button onClick={toggleCollapsed} className="mt-3 hidden w-full justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 lg:flex" title="Agrandir la sidebar">
                        <ChevronRight className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Notifications */}
            <div className={`relative border-b border-slate-200 ${isCollapsed ? 'p-2' : 'p-3'}`}>
                <button onClick={() => setShowNotifications(!showNotifications)} className={`relative flex w-full items-center rounded-lg px-3 py-2.5 font-medium text-slate-700 transition-colors hover:bg-white ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <div className="relative">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                    </div>
                    {!isCollapsed && <><span>Notifications</span>{unreadCount > 0 && <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">{unreadCount}</span>}</>}
                </button>

                {showNotifications && !isCollapsed && (
                    <div className="absolute left-full top-0 z-50 ml-2 flex max-h-[600px] w-96 flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-200 p-4">
                            <h3 className="font-semibold text-slate-900">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && <button onClick={(e) => { e.stopPropagation(); markAllAsRead(); }} className="text-xs font-medium text-slate-600 hover:text-slate-900">Tout marquer comme lu</button>}
                                <button onClick={() => setShowNotifications(false)} className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100"><X className="h-4 w-4" /></button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center"><Bell className="mx-auto mb-3 h-12 w-12 text-slate-300" /><p className="text-sm text-slate-500">Aucune notification</p></div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {notifications.map((notification) => (
                                        <div key={notification.id} className={`p-4 transition-colors hover:bg-slate-50 ${!notification.read ? 'border-l-2 border-slate-900 bg-slate-100/80' : ''}`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notification.priority === 'urgent' ? 'bg-red-500' : notification.priority === 'high' ? 'bg-orange-500' : notification.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className="text-sm font-medium text-slate-900">{notification.title}</h4>
                                                        <button onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
                                                    </div>
                                                    <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <span className="text-xs text-slate-400">{new Date(notification.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{notification.category}</span>
                                                        {!notification.read && (
                                                            <button onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }} className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900">
                                                                <Check className="h-3 w-3" />Marquer comme lu
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                <div className="mb-4">
                    {!isCollapsed && <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Navigation</h3>}
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = view === item.id;
                        return (
                            <div key={item.id} className="relative group">
                                <button onClick={() => onViewChange(item.id)}
                                    className={`flex w-full items-center rounded-lg px-3 py-2.5 font-medium transition-colors ${isCollapsed ? 'justify-center' : 'justify-between'} ${isActive ? 'border border-slate-300 bg-white text-slate-900' : 'text-slate-700 hover:bg-white'}`}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}><Icon className="h-5 w-5 flex-shrink-0" />{!isCollapsed && <span>{item.label}</span>}</div>
                                    {!isCollapsed && item.count !== null && item.count > 0 && (
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.badge ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-700'}`}>{item.count}</span>
                                    )}
                                </button>
                                {isCollapsed && (
                                    <div className="invisible absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white opacity-0 transition-all group-hover:visible group-hover:opacity-100">{item.label}</div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {view === 'contacts' && !isCollapsed && (
                    <div className="border-t border-slate-200 pt-4">
                        <button onClick={() => setShowFilters(!showFilters)} className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:text-slate-600">
                            <div className="flex items-center gap-2"><Filter className="h-4 w-4" />Filtres</div>
                            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        {showFilters && (
                            <div className="space-y-1 mt-2">
                                {filterOptions.map((option) => {
                                    const isActive = filterStatus === option.value;
                                    return (
                                        <button key={option.value} onClick={() => onFilterChange(option.value)}
                                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'border border-slate-300 bg-white text-slate-900' : 'text-slate-600 hover:bg-white'}`}
                                        >
                                            <span>{option.label}</span>
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isActive ? 'bg-slate-200 text-slate-800' : option.color}`}>{option.count}</span>
                                        </button>
                                    );
                                })}
                                {filterStatus !== 'all' && <button onClick={() => onFilterChange('all')} className="w-full py-2 text-center text-xs text-slate-500 transition-colors hover:text-slate-700">Effacer le filtre</button>}
                            </div>
                        )}
                    </div>
                )}
            </nav>

            {/* Bottom */}
            <div className="border-t border-slate-200">
                <div className="relative group p-2">
                    <button onClick={() => onViewChange('settings')}
                        className={`flex w-full items-center rounded-lg px-3 py-2.5 font-medium transition-colors ${isCollapsed ? 'justify-center' : 'gap-3'} ${view === 'settings' ? 'border border-slate-300 bg-white text-slate-900' : 'text-slate-600 hover:bg-white'}`}
                        title={isCollapsed ? 'Paramètres' : undefined}
                    >
                        <Settings className="h-5 w-5" />{!isCollapsed && <span>Paramètres</span>}
                    </button>
                    {isCollapsed && <div className="invisible absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white opacity-0 transition-all group-hover:visible group-hover:opacity-100">Paramètres</div>}
                </div>

                <div className={`p-3 ${isCollapsed ? 'px-2' : ''}`}>
                    <div className="relative">
                        <button onClick={() => !isCollapsed && setShowUserMenu(!showUserMenu)} className={`flex w-full items-center rounded-lg p-2 transition-colors hover:bg-white ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-sm font-semibold text-slate-900">{getInitials(userName)}</div>
                            {!isCollapsed && (
                                <>
                                    <div className="flex-1 text-left"><p className="truncate text-sm font-semibold text-slate-900">{userName}</p><p className="truncate text-xs text-slate-500">{userEmail}</p></div>
                                    <ChevronUp className={`h-4 w-4 text-slate-400 transition-transform ${showUserMenu ? '' : 'rotate-180'}`} />
                                </>
                            )}
                        </button>
                        {showUserMenu && !isCollapsed && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                <button onClick={() => { setShowUserMenu(false); onViewChange('settings'); }} className="flex w-full items-center gap-3 px-4 py-3 text-slate-700 transition-colors hover:bg-slate-50"><User className="h-4 w-4" /><span className="text-sm">Mon profil</span></button>
                                <button onClick={() => { setShowUserMenu(false); onSignOut(); }} className="flex w-full items-center gap-3 px-4 py-3 text-red-600 transition-colors hover:bg-red-50"><LogOut className="h-4 w-4" /><span className="text-sm">Déconnexion</span></button>
                            </div>
                        )}
                    </div>
                    {isCollapsed && (
                        <div className="relative group mt-2">
                            <button onClick={onSignOut} className="flex w-full justify-center rounded-lg p-2.5 text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600" title="Déconnexion"><LogOut className="h-5 w-5" /></button>
                            <div className="invisible absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white opacity-0 transition-all group-hover:visible group-hover:opacity-100">Déconnexion</div>
                        </div>
                    )}
                </div>
                {!isCollapsed && <p className="pb-3 text-center text-xs text-slate-400">v1.0.0</p>}
            </div>
        </aside>
    );
}
