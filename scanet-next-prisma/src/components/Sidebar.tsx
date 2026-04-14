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
        { value: 'all', label: 'Tous les contacts', count: stats.total, color: 'bg-gray-100 text-gray-700' },
        { value: 'lead', label: 'Leads', count: stats.leads, color: 'bg-orange-100 text-orange-700' },
        { value: 'prospect', label: 'Prospects', count: stats.prospects, color: 'bg-amber-100 text-amber-700' },
        { value: 'client', label: 'Clients', count: stats.clients, color: 'bg-emerald-100 text-emerald-700' },
        { value: 'partner', label: 'Partenaires', count: stats.partners, color: 'bg-violet-100 text-violet-700' },
        { value: 'collaborateur', label: 'Collaborateurs', count: stats.collaborateurs || 0, color: 'bg-cyan-100 text-cyan-700' },
        { value: 'ami', label: 'Ami(e)s', count: stats.amis || 0, color: 'bg-pink-100 text-pink-700' },
        { value: 'fournisseur', label: 'Fournisseurs', count: stats.fournisseurs || 0, color: 'bg-amber-100 text-amber-700' },
    ];

    return (
        <aside className={`hidden lg:flex bg-white border-r border-gray-200 flex-col h-screen transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16 lg:w-20' : 'w-72'} relative`}>
            {/* Header */}
            <div className={`p-4 border-b border-gray-200 ${isCollapsed ? 'px-2' : 'p-6'}`}>
                <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
                        <img src="https://i.ibb.co/q3YDjGLC/Scanetwork.png" alt="Scanetwork Logo" className={`${isCollapsed ? 'w-10 h-10' : 'h-12'} object-contain flex-shrink-0`} />
                    </div>
                    {!isCollapsed && (
                        <button onClick={toggleCollapsed} className="hidden lg:block p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Réduire la sidebar">
                            <ChevronLeft className="w-5 h-5 text-gray-400" />
                        </button>
                    )}
                </div>
                {isCollapsed && (
                    <button onClick={toggleCollapsed} className="hidden lg:flex w-full mt-3 p-2 hover:bg-gray-100 rounded-xl transition-colors justify-center" title="Agrandir la sidebar">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                )}
            </div>

            {/* Notifications */}
            <div className={`relative border-b border-gray-200 ${isCollapsed ? 'p-2' : 'p-3'}`}>
                <button onClick={() => setShowNotifications(!showNotifications)} className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-xl font-medium transition-all text-gray-700 hover:bg-gray-100 relative`}>
                    <div className="relative">
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                    </div>
                    {!isCollapsed && <><span>Notifications</span>{unreadCount > 0 && <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">{unreadCount}</span>}</>}
                </button>

                {showNotifications && !isCollapsed && (
                    <div className="absolute left-full top-0 ml-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && <button onClick={(e) => { e.stopPropagation(); markAllAsRead(); }} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Tout marquer comme lu</button>}
                                <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-400" /></button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center"><Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 text-sm">Aucune notification</p></div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {notifications.map((notification) => (
                                        <div key={notification.id} className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/50' : ''}`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notification.priority === 'urgent' ? 'bg-red-500' : notification.priority === 'high' ? 'bg-orange-500' : notification.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className="font-medium text-sm text-gray-900">{notification.title}</h4>
                                                        <button onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <span className="text-xs text-gray-400">{new Date(notification.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${notification.category === 'opportunities' ? 'bg-green-100 text-green-700' : notification.category === 'contacts' ? 'bg-blue-100 text-blue-700' : notification.category === 'follow_ups' ? 'bg-orange-100 text-orange-700' : notification.category === 'events' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{notification.category}</span>
                                                        {!notification.read && (
                                                            <button onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                                                <Check className="w-3 h-3" />Marquer comme lu
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
                    {!isCollapsed && <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">Navigation</h3>}
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = view === item.id;
                        return (
                            <div key={item.id} className="relative group">
                                <button onClick={() => onViewChange(item.id)}
                                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-xl font-medium transition-all ${isActive ? 'bg-[#0E3A5D] text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}><Icon className="w-5 h-5 flex-shrink-0" />{!isCollapsed && <span>{item.label}</span>}</div>
                                    {!isCollapsed && item.count !== null && item.count > 0 && (
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-white/20 text-white' : item.badge ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-700'}`}>{item.count}</span>
                                    )}
                                </button>
                                {isCollapsed && (
                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">{item.label}</div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {view === 'contacts' && !isCollapsed && (
                    <div className="border-t border-gray-100 pt-4">
                        <button onClick={() => setShowFilters(!showFilters)} className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors">
                            <div className="flex items-center gap-2"><Filter className="w-4 h-4" />Filtres</div>
                            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {showFilters && (
                            <div className="space-y-1 mt-2">
                                {filterOptions.map((option) => {
                                    const isActive = filterStatus === option.value;
                                    return (
                                        <button key={option.value} onClick={() => onFilterChange(option.value)}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            <span>{option.label}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-blue-100 text-blue-700' : option.color}`}>{option.count}</span>
                                        </button>
                                    );
                                })}
                                {filterStatus !== 'all' && <button onClick={() => onFilterChange('all')} className="w-full text-center text-xs text-gray-500 hover:text-gray-700 py-2 transition-colors">Effacer le filtre</button>}
                            </div>
                        )}
                    </div>
                )}
            </nav>

            {/* Bottom */}
            <div className="border-t border-gray-200">
                <div className="relative group p-2">
                    <button onClick={() => onViewChange('settings')}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-xl font-medium transition-all ${view === 'settings' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                        title={isCollapsed ? 'Paramètres' : undefined}
                    >
                        <Settings className="w-5 h-5" />{!isCollapsed && <span>Paramètres</span>}
                    </button>
                    {isCollapsed && <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">Paramètres</div>}
                </div>

                <div className={`p-3 ${isCollapsed ? 'px-2' : ''}`}>
                    <div className="relative">
                        <button onClick={() => !isCollapsed && setShowUserMenu(!showUserMenu)} className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} p-2 rounded-xl hover:bg-gray-50 transition-all`}>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0E3A5D] to-[#1e5a8e] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">{getInitials(userName)}</div>
                            {!isCollapsed && (
                                <>
                                    <div className="flex-1 text-left"><p className="text-sm font-semibold text-gray-900 truncate">{userName}</p><p className="text-xs text-gray-500 truncate">{userEmail}</p></div>
                                    <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? '' : 'rotate-180'}`} />
                                </>
                            )}
                        </button>
                        {showUserMenu && !isCollapsed && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                                <button onClick={() => { setShowUserMenu(false); onViewChange('settings'); }} className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"><User className="w-4 h-4" /><span className="text-sm">Mon profil</span></button>
                                <button onClick={() => { setShowUserMenu(false); onSignOut(); }} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"><LogOut className="w-4 h-4" /><span className="text-sm">Déconnexion</span></button>
                            </div>
                        )}
                    </div>
                    {isCollapsed && (
                        <div className="relative group mt-2">
                            <button onClick={onSignOut} className="w-full flex justify-center p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Déconnexion"><LogOut className="w-5 h-5" /></button>
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">Déconnexion</div>
                        </div>
                    )}
                </div>
                {!isCollapsed && <p className="text-center text-xs text-gray-400 pb-3">v1.0.0</p>}
            </div>
        </aside>
    );
}
