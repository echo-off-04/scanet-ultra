import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
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
      case 'success':
        toast.success(content);
        break;
      case 'error':
        toast.error(content);
        break;
      case 'warning':
        toast.warning(content);
        break;
      default:
        toast.info(content);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }

    setNotifications(data || []);
    setUnreadCount(data?.filter(n => !n.read).length || 0);
  }, [user]);

  const loadPreferences = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching preferences:', error);
      return;
    }

    if (!data) {
      const { data: newPrefs, error: createError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          contacts_enabled: true,
          opportunities_enabled: true,
          reminders_enabled: true,
          team_activity_enabled: true,
          quiet_hours_enabled: false,
          email_digest: 'daily'
        })
        .select()
        .single();

      if (!createError && newPrefs) {
        setPreferences(newPrefs);
      }
    } else {
      setPreferences(data);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (!error) {
      await refreshNotifications();
    }
  }, [refreshNotifications]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (!error) {
      await refreshNotifications();
    }
  }, [user, refreshNotifications]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (!error) {
      await refreshNotifications();
    }
  }, [refreshNotifications]);

  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user) return;

    const { error } = await supabase
      .from('notification_preferences')
      .update(newPreferences)
      .eq('user_id', user.id);

    if (!error) {
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

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          if (newNotification.priority === 'urgent' || newNotification.priority === 'high') {
            showToast(newNotification.title, newNotification.message, 'warning');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshNotifications, loadPreferences, showToast]);

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
        refreshNotifications
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
