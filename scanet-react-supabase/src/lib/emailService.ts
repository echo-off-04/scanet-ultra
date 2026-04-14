import { supabase } from './supabase';

export interface EmailData {
  name?: string;
  opportunityTitle?: string;
  opportunityUrl?: string;
  value?: number;
  eventName?: string;
  eventUrl?: string;
  location?: string;
  time?: string;
  resetUrl?: string;
  dashboardUrl?: string;
  [key: string]: any;
}

export type EmailTemplateType =
  | 'welcome'
  | 'opportunity_won'
  | 'event_reminder'
  | 'password_reset'
  | 'offer_individual'
  | 'offer_pack'
  | 'follow_up';

interface SendEmailParams {
  to: string;
  templateType: EmailTemplateType;
  data?: EmailData;
}

interface SendCustomEmailParams {
  to: string;
  subject: string;
  html: string;
  metadata?: Record<string, any>;
}

export async function sendEmail({ to, templateType, data }: SendEmailParams): Promise<{ success: boolean; error?: string; trackingToken?: string; emailLogId?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('No active session');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    console.log('Sending email to:', to);
    console.log('Template type:', templateType);
    console.log('Supabase URL:', supabaseUrl);

    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        to,
        templateType,
        metadata: data,
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    const result = await response.json();
    console.log('Response result:', result);

    if (!response.ok) {
      const errorMsg = result.error || result.message || 'Failed to send email';
      console.error('Email API error details:', {
        status: response.status,
        error: errorMsg,
        fullResult: result
      });
      throw new Error(errorMsg);
    }

    return {
      success: true,
      trackingToken: result.trackingToken,
      emailLogId: result.emailLogId,
    };
  } catch (error) {
    console.error('Error sending email (full):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendCustomEmail({ to, subject, html, metadata }: SendCustomEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('No active session');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        templateType: 'custom',
        metadata,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send email');
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending custom email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendWelcomeEmail(to: string, name: string): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to,
    templateType: 'welcome',
    data: {
      name,
      dashboardUrl: `${window.location.origin}/dashboard`,
    },
  });
}

export async function sendOpportunityWonEmail(
  to: string,
  opportunityTitle: string,
  value: number,
  opportunityId: string
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to,
    templateType: 'opportunity_won',
    data: {
      opportunityTitle,
      value,
      opportunityUrl: `${window.location.origin}/opportunities/${opportunityId}`,
    },
  });
}

export async function sendEventReminderEmail(
  to: string,
  eventName: string,
  location: string,
  time: string,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to,
    templateType: 'event_reminder',
    data: {
      eventName,
      location,
      time,
      eventUrl: `${window.location.origin}/events/${eventId}`,
    },
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to,
    templateType: 'password_reset',
    data: {
      resetUrl,
    },
  });
}

export async function getEmailLogs(userId: string) {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return { data: null, error };
  }
}

export async function getEmailPreferences(userId: string) {
  try {
    const { data, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching email preferences:', error);
    return { data: null, error };
  }
}

export async function updateEmailPreferences(
  userId: string,
  preferences: {
    welcome_emails?: boolean;
    notification_emails?: boolean;
    marketing_emails?: boolean;
    opportunity_emails?: boolean;
    event_emails?: boolean;
    digest_frequency?: 'never' | 'daily' | 'weekly' | 'monthly';
  }
) {
  try {
    const { data, error } = await supabase
      .from('email_preferences')
      .update({
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating email preferences:', error);
    return { data: null, error };
  }
}

export async function sendOfferEmail(
  to: string,
  offerData: {
    title: string;
    description?: string;
    price: number;
    original_price?: number;
    currency?: string;
    image_url?: string;
    features?: string[];
    valid_until?: string;
    terms?: string;
    billing_type?: string;
    senderName: string;
    message: string;
  }
): Promise<{ success: boolean; error?: string; trackingToken?: string; emailLogId?: string }> {
  try {
    const result = await sendEmail({
      to,
      templateType: 'offer_individual',
      data: offerData,
    });

    return result;
  } catch (error) {
    console.error('Error sending offer email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendOfferPackEmail(
  to: string,
  packData: {
    title: string;
    description?: string;
    total_price: number;
    total_original_price?: number;
    discount_percentage?: number;
    currency?: string;
    items: Array<{
      title: string;
      description?: string;
      price: number;
      quantity?: number;
    }>;
    valid_until?: string;
    senderName: string;
    message: string;
  }
): Promise<{ success: boolean; error?: string; trackingToken?: string; emailLogId?: string }> {
  try {
    const result = await sendEmail({
      to,
      templateType: 'offer_pack',
      data: packData,
    });

    return result;
  } catch (error) {
    console.error('Error sending pack email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
