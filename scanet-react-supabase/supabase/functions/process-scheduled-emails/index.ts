import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = 'noreply@toundeadamaze.me';

interface ScheduledEmail {
  id: string;
  user_id: string;
  subject: string;
  body: string;
  scheduled_for: string;
  status: string;
}

interface Recipient {
  id: string;
  scheduled_email_id: string;
  contact_id: string | null;
  email: string;
  status: string;
}

const followUpEmailTemplate = (subject: string, body: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa; line-height: 1.6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="640" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(14, 58, 93, 0.12);">
            <tr>
              <td style="background: linear-gradient(135deg, #0E3A5D 0%, #1E5A8E 100%); padding: 45px 40px 35px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 30px; font-weight: 700; letter-spacing: -0.5px;">${subject}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 45px 40px;">
                <div style="margin-bottom: 30px;">
                  <p style="color: #1e293b; font-size: 17px; line-height: 1.7; margin: 0; white-space: pre-line;">
${body}
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="text-align: center;">
                      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                        &copy; ${new Date().getFullYear()} ScaNetwork. Tous droits r&eacute;serv&eacute;s.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

async function sendEmailViaResend(to: string, subject: string, html: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject: subject,
      html: html,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to send email');
  }

  return data;
}

function replaceTemplateVariables(text: string, context: Record<string, string>, senderProfile: Record<string, string> | null): string {
  let result = text;
  const contactName = context.contact_name || '';
  const firstName = contactName.split(' ')[0] || contactName;

  result = result.replace(/\{\{prenom\}\}/g, firstName);
  result = result.replace(/\{\{nom_complet\}\}/g, contactName);
  result = result.replace(/\{\{entreprise\}\}/g, context.contact_company || '');
  result = result.replace(/\{\{evenement\}\}/g, context.event_name || '');
  result = result.replace(/\{\{date_rencontre\}\}/g, context.event_date || '');
  result = result.replace(/\{\{source\}\}/g, context.source || '');
  result = result.replace(/\{\{mon_nom\}\}/g, senderProfile?.full_name || '');

  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let isSystemCall = false;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');

      if (token === supabaseServiceKey) {
        isSystemCall = true;
      } else {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.role === 'anon') {
            isSystemCall = true;
          } else {
            const { data: { user }, error: userError } = await supabase.auth.getUser(token);
            if (userError || !user) {
              return new Response(
                JSON.stringify({ success: false, error: 'Invalid token' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
            userId = user.id;
          }
        } catch {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid token format' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } else {
      isSystemCall = true;
    }

    const now = new Date().toISOString();

    let totalProcessed = 0;
    let totalSent = 0;
    let totalFailed = 0;

    // ===== PART 1: Process regular scheduled emails =====
    let query = supabase
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .limit(50);

    if (userId && !isSystemCall) {
      query = query.eq('user_id', userId);
    }

    const { data: scheduledEmails, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching scheduled emails:', fetchError);
    }

    if (scheduledEmails && scheduledEmails.length > 0) {
      for (const email of scheduledEmails as ScheduledEmail[]) {
        try {
          const { data: recipients, error: recipientsError } = await supabase
            .from('scheduled_email_recipients')
            .select('*')
            .eq('scheduled_email_id', email.id)
            .eq('status', 'pending');

          if (recipientsError) {
            console.error(`Error fetching recipients for email ${email.id}:`, recipientsError);
            continue;
          }

          if (!recipients || recipients.length === 0) {
            await supabase
              .from('scheduled_emails')
              .update({ status: 'sent', sent_at: new Date().toISOString() })
              .eq('id', email.id);
            continue;
          }

          const emailHtml = followUpEmailTemplate(email.subject, email.body);
          let sentCount = 0;
          let failedCount = 0;

          for (const recipient of recipients as Recipient[]) {
            try {
              const resendData = await sendEmailViaResend(recipient.email, email.subject, emailHtml);

              const { data: emailLog } = await supabase
                .from('email_logs')
                .insert({
                  user_id: email.user_id,
                  to_email: recipient.email,
                  from_email: FROM_EMAIL,
                  subject: email.subject,
                  template_type: 'follow_up',
                  status: 'sent',
                  resend_id: resendData.id,
                  metadata: { scheduled_email_id: email.id },
                  sent_at: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                })
                .select()
                .maybeSingle();

              await supabase
                .from('scheduled_email_recipients')
                .update({
                  status: 'sent',
                  sent_at: new Date().toISOString(),
                  email_log_id: emailLog?.id,
                })
                .eq('id', recipient.id);

              sentCount++;
              totalSent++;
            } catch (error) {
              console.error(`Error sending to ${recipient.email}:`, error);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';

              await supabase
                .from('scheduled_email_recipients')
                .update({ status: 'failed', error_message: errorMessage })
                .eq('id', recipient.id);

              await supabase
                .from('email_logs')
                .insert({
                  user_id: email.user_id,
                  to_email: recipient.email,
                  from_email: FROM_EMAIL,
                  subject: email.subject,
                  template_type: 'follow_up',
                  status: 'failed',
                  error_message: errorMessage,
                  metadata: { scheduled_email_id: email.id },
                  created_at: new Date().toISOString(),
                });

              failedCount++;
              totalFailed++;
            }
          }

          const allRecipients = recipients.length;
          const newStatus = failedCount === allRecipients ? 'failed' : 'sent';

          await supabase
            .from('scheduled_emails')
            .update({
              status: newStatus,
              sent_at: new Date().toISOString(),
              error_message: failedCount > 0 ? `${failedCount} recipient(s) failed` : null,
            })
            .eq('id', email.id);

          if (sentCount > 0) {
            await supabase.from('notifications').insert({
              user_id: email.user_id,
              title: 'Relance envoyee',
              message: `${sentCount} email${sentCount > 1 ? 's' : ''} envoye${sentCount > 1 ? 's' : ''}: ${email.subject}`,
              type: 'success',
              read: false,
              created_at: new Date().toISOString(),
            });
          }

          if (failedCount > 0) {
            await supabase.from('notifications').insert({
              user_id: email.user_id,
              title: 'Echec envoi relance',
              message: `${failedCount} email${failedCount > 1 ? 's' : ''} en echec: ${email.subject}`,
              type: 'error',
              read: false,
              created_at: new Date().toISOString(),
            });
          }

          totalProcessed++;
        } catch (error) {
          console.error(`Error processing email ${email.id}:`, error);
          await supabase
            .from('scheduled_emails')
            .update({
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error',
            })
            .eq('id', email.id);
        }
      }
    }

    // ===== PART 2: Process email sequence sends =====
    let seqQuery = supabase
      .from('email_sequence_sends')
      .select(`
        id, enrollment_id, step_id, status, scheduled_for,
        enrollment:email_sequence_enrollments!inner(
          id, sequence_id, contact_id, user_id, status, trigger_context,
          contact:contacts(full_name, email, phone, company),
          sequence:email_sequences(name, is_active)
        ),
        step:email_sequence_steps(
          step_order, delay_days, delay_hours, subject, body, channel, include_offer_id
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .limit(50);

    if (userId && !isSystemCall) {
      seqQuery = seqQuery.eq('enrollment.user_id', userId);
    }

    const { data: sequenceSends, error: seqFetchError } = await seqQuery;

    if (seqFetchError) {
      console.error('Error fetching sequence sends:', seqFetchError);
    }

    if (sequenceSends && sequenceSends.length > 0) {
      const profileCache: Record<string, Record<string, string> | null> = {};

      for (const send of sequenceSends) {
        try {
          const enrollment = send.enrollment as any;
          const step = send.step as any;
          const contact = enrollment?.contact as any;
          const sequence = enrollment?.sequence as any;

          if (!enrollment || !step || !contact) {
            await supabase
              .from('email_sequence_sends')
              .update({ status: 'failed', error_message: 'Missing enrollment, step, or contact data' })
              .eq('id', send.id);
            totalFailed++;
            continue;
          }

          if (enrollment.status !== 'active' || !sequence?.is_active) {
            await supabase
              .from('email_sequence_sends')
              .update({ status: 'skipped', error_message: 'Enrollment or sequence inactive' })
              .eq('id', send.id);
            continue;
          }

          const sendUserId = enrollment.user_id;

          if (!profileCache[sendUserId]) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, company')
              .eq('id', sendUserId)
              .maybeSingle();
            profileCache[sendUserId] = profile as Record<string, string> | null;
          }

          const context = (enrollment.trigger_context || {}) as Record<string, string>;
          const senderProfile = profileCache[sendUserId];

          if (step.channel === 'whatsapp') {
            await supabase
              .from('email_sequence_sends')
              .update({ status: 'skipped', error_message: 'WhatsApp steps require manual action' })
              .eq('id', send.id);
            continue;
          }

          if (!contact.email) {
            await supabase
              .from('email_sequence_sends')
              .update({ status: 'failed', error_message: 'Contact has no email address' })
              .eq('id', send.id);
            totalFailed++;
            continue;
          }

          const subject = replaceTemplateVariables(step.subject, context, senderProfile);
          const body = replaceTemplateVariables(step.body, context, senderProfile);

          let emailHtml = followUpEmailTemplate(subject, body);

          if (step.include_offer_id) {
            const { data: offer } = await supabase
              .from('offers')
              .select('title, description, price, currency')
              .eq('id', step.include_offer_id)
              .maybeSingle();

            if (offer) {
              const offerBlock = `<div style="margin-top: 20px; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; border: 1px solid #bae6fd;">
                <h3 style="margin: 0 0 8px; color: #0E3A5D; font-size: 18px;">${offer.title}</h3>
                ${offer.description ? `<p style="margin: 0 0 12px; color: #475569; font-size: 14px;">${offer.description}</p>` : ''}
                <p style="margin: 0; font-size: 24px; font-weight: 700; color: #0E3A5D;">${offer.price} ${offer.currency}</p>
              </div>`;
              emailHtml = emailHtml.replace('</div>\n              </td>', offerBlock + '</div>\n              </td>');
            }
          }

          const resendData = await sendEmailViaResend(contact.email, subject, emailHtml);

          const { data: emailLog } = await supabase
            .from('email_logs')
            .insert({
              user_id: sendUserId,
              to_email: contact.email,
              from_email: FROM_EMAIL,
              subject: subject,
              template_type: 'follow_up',
              status: 'sent',
              resend_id: resendData.id,
              metadata: {
                sequence_id: enrollment.sequence_id,
                enrollment_id: enrollment.id,
                step_order: step.step_order,
              },
              sent_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            })
            .select()
            .maybeSingle();

          await supabase
            .from('email_sequence_sends')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              email_log_id: emailLog?.id,
            })
            .eq('id', send.id);

          await supabase
            .from('email_sequence_enrollments')
            .update({ current_step: step.step_order })
            .eq('id', enrollment.id);

          const { data: remainingSends } = await supabase
            .from('email_sequence_sends')
            .select('id')
            .eq('enrollment_id', enrollment.id)
            .eq('status', 'pending');

          if (!remainingSends || remainingSends.length === 0) {
            await supabase
              .from('email_sequence_enrollments')
              .update({ status: 'completed', completed_at: new Date().toISOString() })
              .eq('id', enrollment.id);
          }

          totalSent++;
          totalProcessed++;

        } catch (error) {
          console.error(`Error processing sequence send ${send.id}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          await supabase
            .from('email_sequence_sends')
            .update({ status: 'failed', error_message: errorMessage })
            .eq('id', send.id);

          totalFailed++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Emails processed',
        processed: totalProcessed,
        sent: totalSent,
        failed: totalFailed,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing scheduled emails:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
