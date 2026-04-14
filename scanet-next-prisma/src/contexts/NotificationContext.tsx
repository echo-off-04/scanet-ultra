'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

export type NotificationCategory =
    | 'contacts'
    | 'opportunities'
    | 'follow_ups'
    | 'events'
    | 'team_activity'
    | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
    id: string;
    user_id: string;
    type: string;
    category: NotificationCategory;
    title: string;
    message: string;
    action_url?: string;
    read: boolean;
    priority: NotificationPriority;
    metadata?: Record<string, any>;
    expires_at?: string;
    created_at: string;
}

export interface NotificationPreferences {
    id: string;
    user_id: string;
    contacts_enabled: boolean;
    opportunities_enabled: boolean;
    reminders_enabled: boolean;
    team_activity_enabled: boolean;
    quiet_hours_enabled: boolean;
    quiet_hours_start?: string;
    quiet_hours_end?: string;
    email_digest: 'never' | 'daily' | 'weekly';
    created_at: string;
    updated_at: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    preferences: NotificationPreferences | null;
    showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const showToast = useCallback((
        title: string,
        message?: string,
        type: 'success' | 'error' | 'info' | 'warning' = 'info'
    ) => {
        const content = message ? `${title}: ${message}` : title;
        switch (type) {
            case 'success': toast.success(content); break;
            case 'error': toast.error(content); break;
            case 'warning': toast.warning(content); break;
            default: toast.info(content);
        }
    }, []);

    const refreshNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                // Map both camelCase and snake_case for compatibility
                const mapped = (data.notifications || []).map((n: any) => ({
                    id: n.id,
                    user_id: n.user_id ?? n.userId,
                    type: n.type,
                    category: n.category,
                    title: n.title,
                    message: n.message,
                    action_url: n.action_url ?? n.actionUrl,
                    read: n.read,
                    priority: n.priority,
                    metadata: n.metadata,
                    expires_at: n.expires_at ?? n.expiresAt,
                    created_at: n.created_at ?? n.createdAt,
                }));
                setNotifications(mapped);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, [user]);

    const loadPreferences = useCallback(async () => {
        if (!user) return;
        try {
            const res = await fetch('/api/notification-preferences');
            if (res.ok) {
                const data = await res.json();
                setPreferences({
                    id: data.id,
                    user_id: data.userId,
                    contacts_enabled: data.contactReminders ?? true,
                    opportunities_enabled: data.opportunityAlerts ?? true,
                    reminders_enabled: data.eventReminders ?? true,
                    team_activity_enabled: data.systemNotifications ?? true,
                    quiet_hours_enabled: false,
                    email_digest: data.dailyDigest ? 'daily' : data.weeklyReport ? 'weekly' : 'never',
                    created_at: data.createdAt,
                    updated_at: data.updatedAt,
                });
            }
        } catch (error) {
            console.error('Error fetching preferences:', error);
        }
    }, [user]);

    const markAsRead = useCallback(async (notificationId: string) => {
        await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'mark_read', id: notificationId }),
        });
        await refreshNotifications();
    }, [refreshNotifications]);

    const markAllAsRead = useCallback(async () => {
        await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'mark_all_read' }),
        });
        await refreshNotifications();
    }, [refreshNotifications]);

    const deleteNotification = useCallback(async (notificationId: string) => {
        await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id: notificationId }),
        });
        await refreshNotifications();
    }, [refreshNotifications]);

    const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
        if (!user) return;
        const res = await fetch('/api/notification-preferences', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contactReminders: newPreferences.contacts_enabled,
                opportunityAlerts: newPreferences.opportunities_enabled,
                eventReminders: newPreferences.reminders_enabled,
                systemNotifications: newPreferences.team_activity_enabled,
            }),
        });

        if (res.ok) {
            await loadPreferences();
            showToast('Préférences mises à jour', '', 'success');
        } else {
            showToast('Erreur', 'Impossible de mettre à jour les préférences', 'error');
        }
    }, [user, loadPreferences, showToast]);

    useEffect(() => {
        if (!user) return;

        refreshNotifications();
        loadPreferences();

        // Poll for new notifications every 10 seconds (replacing Supabase realtime)
        const interval = setInterval(refreshNotifications, 10000);
        return () => clearInterval(interval);
    }, [user, refreshNotifications, loadPreferences]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                preferences,
                showToast,
                markAsRead,
                markAllAsRead,
                deleteNotification,
                updatePreferences,
                refreshNotifications,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
