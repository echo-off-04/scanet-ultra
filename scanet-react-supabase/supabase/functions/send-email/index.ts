import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = 'noreply@toundeadamaze.me';

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  templateType: string;
  metadata?: Record<string, any>;
}

interface EmailTemplate {
  subject: string;
  html: (data: any) => string;
}

const emailTemplates: Record<string, EmailTemplate> = {
  welcome: {
    subject: 'Bienvenue sur ScaNetwork !',
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenue</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0E3A5D 0%, #1E5A8E 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Bienvenue sur ScaNetwork !</h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Hello ${data.name || 'Cher utilisateur'},</p>

                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                        Nous sommes ravis de vous accueillir ! Votre compte a été créé avec succès.
                      </p>

                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                        ScaNetwork vous aide à gérer vos contacts professionnels, suivre vos opportunités et optimiser votre réseau.
                      </p>

                      <!-- Features -->
                      <div style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
                        <h2 style="color: #0E3A5D; font-size: 18px; margin: 0 0 15px;">Fonctionnalités principales :</h2>
                        <ul style="color: #555555; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                          <li>Gestion centralisée de vos contacts</li>
                          <li>Suivi des opportunités commerciales</li>
                          <li>Organisation d'événements professionnels</li>
                          <li>Tableaux de bord et statistiques</li>
                          <li>Notifications en temps réel</li>
                        </ul>
                      </div>

                      <!-- CTA Button -->
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${data.dashboardUrl || 'https://app.ScaNetwork.com'}" style="display: inline-block; background-color: #0E3A5D; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                          Accéder au tableau de bord
                        </a>
                      </div>

                      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0;">
                        Si vous avez des questions, n'hésitez pas à nous contacter.
                      </p>

                      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 10px 0 0;">
                        À bientôt,<br>
                        <strong>L'équipe ScaNetwork</strong>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="color: #999999; font-size: 12px; margin: 0;">
                        © 2026 ScaNetwork. Tous droits réservés.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  },

  opportunity_won: {
    subject: '🎉 Félicitations ! Opportunité gagnée',
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Opportunité gagnée</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Félicitations !</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                        Excellente nouvelle ! Vous avez gagné l'opportunité :
                      </p>
                      <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px;">
                        <h2 style="color: #059669; margin: 0 0 10px; font-size: 20px;">${data.opportunityTitle}</h2>
                        ${data.value ? `<p style="color: #047857; font-size: 24px; font-weight: 600; margin: 10px 0 0;">${data.value} €</p>` : ''}
                      </div>
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${data.opportunityUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600;">
                          Voir les détails
                        </a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
                      <p style="color: #999999; font-size: 12px; margin: 0;">© 2026 ScaNetwork</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  },

  event_reminder: {
    subject: '📅 Rappel : Événement demain',
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Rappel événement</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📅 Rappel d'événement</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                        N'oubliez pas votre événement demain :
                      </p>
                      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                        <h2 style="color: #1e40af; margin: 0 0 10px; font-size: 20px;">${data.eventName}</h2>
                        <p style="color: #1e3a8a; margin: 5px 0;">📍 ${data.location || 'Lieu à confirmer'}</p>
                        <p style="color: #1e3a8a; margin: 5px 0;">🕐 ${data.time || ''}</p>
                      </div>
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${data.eventUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600;">
                          Voir l'événement
                        </a>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
                      <p style="color: #999999; font-size: 12px; margin: 0;">© 2026 ScaNetwork</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  },

  password_reset: {
    subject: 'Réinitialisation de votre mot de passe',
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Réinitialisation mot de passe</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #0E3A5D 0%, #1E5A8E 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔒 Réinitialisation</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                        Vous avez demandé à réinitialiser votre mot de passe.
                      </p>
                      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 30px;">
                        Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe. Ce lien expirera dans 1 heure.
                      </p>
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${data.resetUrl}" style="display: inline-block; background-color: #0E3A5D; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600;">
                          Réinitialiser mon mot de passe
                        </a>
                      </div>
                      <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 30px 0 0; padding: 15px; background-color: #fef3c7; border-radius: 4px;">
                        ⚠️ Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe restera inchangé.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center;">
                      <p style="color: #999999; font-size: 12px; margin: 0;">© 2026 ScaNetwork</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  },

  offer_individual: {
    subject: (data: any) => `${data.senderName} vous propose une offre`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nouvelle offre commerciale</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa; line-height: 1.6;">
          <!-- Tracking Pixel -->
          <img src="${data.trackingUrl}/open" width="1" height="1" style="display:none;" />

          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="640" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(14, 58, 93, 0.12);">

                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0E3A5D 0%, #165780 100%); padding: 45px 40px 35px; text-align: center;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="text-align: center;">
                            <h1 style="color: #ffffff; margin: 0 0 10px; font-size: 30px; font-weight: 700; letter-spacing: -0.5px;">${data.title}</h1>
                            <p style="color: #a8c5e0; margin: 0; font-size: 15px; font-weight: 500;">Proposition de ${data.senderName || 'Un partenaire'}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Main Message Body -->
                  <tr>
                    <td style="padding: 45px 40px;">
                      <div style="margin-bottom: 40px;">
                        <p style="color: #1e293b; font-size: 17px; line-height: 1.7; margin: 0; white-space: pre-line;">
${data.message}
                        </p>
                      </div>

                      <!-- Offer Details Card -->
                      <div style="background: linear-gradient(135deg, #f0f5f9 0%, #e6eef5 100%); border: 2px solid #c8dbe8; border-radius: 12px; padding: 35px; margin: 40px 0;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="text-align: center;">
                              ${data.image_url ? `
                                <div style="margin-bottom: 25px;">
                                  <img src="${data.image_url}" alt="${data.title}" style="max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 0 auto;" />
                                </div>
                              ` : ''}

                              <div style="margin-bottom: 20px;">
                                ${data.original_price && data.original_price !== data.price ? `
                                  <p style="color: #94a3b8; font-size: 20px; margin: 0 0 8px; text-decoration: line-through; font-weight: 500;">
                                    ${data.original_price.toFixed(2)} ${data.currency || 'EUR'}
                                  </p>
                                ` : ''}
                                <p style="color: #0E3A5D; font-size: 54px; font-weight: 800; margin: 0; line-height: 1;">
                                  ${data.price.toFixed(2)} <span style="font-size: 24px; font-weight: 600; color: #165780;">${data.currency || 'EUR'}</span>
                                </p>
                                ${data.billing_type ? `
                                  <p style="color: #64748b; font-size: 14px; margin: 10px 0 0; font-weight: 500;">
                                    ${data.billing_type === 'one_time' ? 'Paiement unique' :
                                      data.billing_type === 'monthly' ? 'par mois' :
                                      data.billing_type === 'yearly' ? 'par an' :
                                      data.billing_type === 'quarterly' ? 'par trimestre' : ''}
                                  </p>
                                ` : ''}
                              </div>

                              ${data.description ? `
                                <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 20px 0 0; text-align: center;">
                                  ${data.description}
                                </p>
                              ` : ''}
                            </td>
                          </tr>
                        </table>
                      </div>

                      ${data.features && data.features.length > 0 ? `
                        <div style="margin: 35px 0;">
                          <h3 style="color: #0E3A5D; font-size: 17px; margin: 0 0 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Inclus dans cette offre</h3>
                          <table width="100%" cellpadding="0" cellspacing="0">
                            ${data.features.map((feature: string) => `
                              <tr>
                                <td style="padding: 10px 0;">
                                  <table cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td style="width: 30px; vertical-align: top; padding-top: 3px;">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                          <circle cx="10" cy="10" r="10" fill="#0E3A5D"/>
                                          <path d="M6 10L8.5 12.5L14 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                      </td>
                                      <td style="padding-left: 12px;">
                                        <span style="color: #334155; font-size: 15px; line-height: 1.6;">${feature}</span>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            `).join('')}
                          </table>
                        </div>
                      ` : ''}

                      ${data.valid_until ? `
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 30px 0; border-radius: 6px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="vertical-align: top; padding-right: 10px;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="12" cy="12" r="10" stroke="#92400e" stroke-width="2"/>
                                  <path d="M12 6V12L16 14" stroke="#92400e" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                              </td>
                              <td>
                                <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 600; line-height: 1.4;">
                                  Offre valable jusqu'au ${new Date(data.valid_until).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                              </td>
                            </tr>
                          </table>
                        </div>
                      ` : ''}

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 40px 0 20px;">
                        <tr>
                          <td align="center">
                            <a href="${data.trackingUrl}/accept" style="display: inline-block; background: linear-gradient(135deg, #0E3A5D 0%, #165780 100%); color: #ffffff; text-decoration: none; padding: 18px 60px; border-radius: 10px; font-weight: 700; font-size: 17px; box-shadow: 0 6px 20px rgba(14, 58, 93, 0.3); letter-spacing: 0.3px;">
                              Accepter cette offre
                            </a>
                          </td>
                        </tr>
                      </table>

                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${data.trackingUrl}/decline" style="color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 500;">
                              Non merci, je ne suis pas intéressé(e)
                            </a>
                          </td>
                        </tr>
                      </table>

                      ${data.terms ? `
                        <div style="margin-top: 35px; padding-top: 25px; border-top: 2px solid #e2e8f0;">
                          <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0;">
                            <strong style="color: #475569;">Conditions :</strong> ${data.terms}
                          </p>
                        </div>
                      ` : ''}
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="text-align: center;">
                            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 12px;">
                              Une question sur cette offre ? Contactez-nous directement.
                            </p>
                            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                              © 2026 ScaNetwork. Tous droits réservés.
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
    `,
  },

  follow_up: {
    subject: (data: any) => data.subject || 'Message de relance',
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${data.subject || 'Message de relance'}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa; line-height: 1.6;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="640" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(14, 58, 93, 0.12);">

                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0E3A5D 0%, #1E5A8E 100%); padding: 45px 40px 35px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 30px; font-weight: 700; letter-spacing: -0.5px;">${data.subject || 'Message de relance'}</h1>
                    </td>
                  </tr>

                  <!-- Message Body -->
                  <tr>
                    <td style="padding: 45px 40px;">
                      <div style="margin-bottom: 30px;">
                        <p style="color: #1e293b; font-size: 17px; line-height: 1.7; margin: 0; white-space: pre-line;">
${data.body || ''}
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="text-align: center;">
                            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                              © ${new Date().getFullYear()} ScaNetwork. Tous droits réservés.
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
    `,
  },

  offer_pack: {
    subject: (data: any) => `${data.senderName} vous propose un pack exclusif`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pack d'offres exclusif</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa; line-height: 1.6;">
          <!-- Tracking Pixel -->
          <img src="${data.trackingUrl}/open" width="1" height="1" style="display:none;" />

          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="640" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(14, 58, 93, 0.12);">

                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0E3A5D 0%, #165780 100%); padding: 45px 40px 35px; text-align: center;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="text-align: center;">
                            <div style="margin-bottom: 12px;">
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block;">
                                <rect x="3" y="3" width="7" height="7" rx="1" stroke="white" stroke-width="2" fill="none"/>
                                <rect x="14" y="3" width="7" height="7" rx="1" stroke="white" stroke-width="2" fill="none"/>
                                <rect x="3" y="14" width="7" height="7" rx="1" stroke="white" stroke-width="2" fill="none"/>
                                <rect x="14" y="14" width="7" height="7" rx="1" stroke="white" stroke-width="2" fill="none"/>
                              </svg>
                            </div>
                            <h1 style="color: #ffffff; margin: 0 0 10px; font-size: 30px; font-weight: 700; letter-spacing: -0.5px;">${data.title}</h1>
                            <p style="color: #a8c5e0; margin: 0; font-size: 15px; font-weight: 500;">Pack proposé par ${data.senderName || 'Un partenaire'}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Main Message Body -->
                  <tr>
                    <td style="padding: 45px 40px;">
                      <div style="margin-bottom: 40px;">
                        <p style="color: #1e293b; font-size: 17px; line-height: 1.7; margin: 0; white-space: pre-line;">
${data.message}
                        </p>
                      </div>

                      <!-- Pack Price Card -->
                      <div style="background: linear-gradient(135deg, #f0f5f9 0%, #e6eef5 100%); border: 2px solid #c8dbe8; border-radius: 12px; padding: 35px; margin: 40px 0; text-align: center;">
                        ${data.discount_percentage ? `
                          <div style="display: inline-block; background-color: #dc2626; color: white; padding: 10px 20px; border-radius: 25px; font-size: 15px; font-weight: 700; margin-bottom: 20px; letter-spacing: 0.5px;">
                            ÉCONOMISEZ ${data.discount_percentage}%
                          </div>
                        ` : ''}

                        <div style="margin: 20px 0;">
                          ${data.total_original_price && data.total_original_price !== data.total_price ? `
                            <p style="color: #94a3b8; font-size: 20px; margin: 0 0 8px; text-decoration: line-through; font-weight: 500;">
                              ${data.total_original_price.toFixed(2)} ${data.currency || 'EUR'}
                            </p>
                          ` : ''}
                          <p style="color: #0E3A5D; font-size: 54px; font-weight: 800; margin: 0; line-height: 1;">
                            ${data.total_price.toFixed(2)} <span style="font-size: 24px; font-weight: 600; color: #165780;">${data.currency || 'EUR'}</span>
                          </p>
                          <p style="color: #64748b; font-size: 14px; margin: 12px 0 0; font-weight: 500;">
                            Valeur totale : ${(data.items || []).reduce((sum: number, item: any) => sum + (item.price * (item.quantity || 1) || 0), 0).toFixed(2)} ${data.currency || 'EUR'}
                          </p>
                        </div>
                      </div>

                      ${data.description ? `
                        <div style="margin: 30px 0;">
                          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0; text-align: center;">
                            ${data.description}
                          </p>
                        </div>
                      ` : ''}

                      ${data.items && data.items.length > 0 ? `
                        <div style="margin: 40px 0;">
                          <h3 style="color: #0E3A5D; font-size: 17px; margin: 0 0 25px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Contenu du pack</h3>

                          ${data.items.map((item: any, index: number) => `
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 10px; margin-bottom: 15px; overflow: hidden;">
                              <tr>
                                <td style="padding: 20px;">
                                  <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td style="width: 50px; vertical-align: top;">
                                        <div style="width: 38px; height: 38px; background: linear-gradient(135deg, #0E3A5D 0%, #165780 100%); border-radius: 50%; text-align: center; line-height: 38px; color: #ffffff; font-weight: 700; font-size: 16px;">
                                          ${index + 1}
                                        </div>
                                      </td>
                                      <td style="padding-left: 15px;">
                                        <h4 style="color: #0f172a; font-size: 16px; margin: 0 0 8px; font-weight: 700;">${item.title}</h4>
                                        ${item.description ? `
                                          <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0 0 12px;">
                                            ${item.description}
                                          </p>
                                        ` : ''}
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                          <tr>
                                            <td style="vertical-align: middle;">
                                              ${item.quantity > 1 ? `
                                                <span style="display: inline-block; background-color: #e6eef5; color: #0E3A5D; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 600;">
                                                  Quantité : ${item.quantity}
                                                </span>
                                              ` : ''}
                                            </td>
                                            <td style="text-align: right; vertical-align: middle;">
                                              <span style="color: #0E3A5D; font-size: 17px; font-weight: 700;">
                                                ${(item.price * (item.quantity || 1)).toFixed(2)} ${data.currency || 'EUR'}
                                              </span>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          `).join('')}
                        </div>
                      ` : ''}

                      ${data.valid_until ? `
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 30px 0; border-radius: 6px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="vertical-align: top; padding-right: 10px;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="12" cy="12" r="10" stroke="#92400e" stroke-width="2"/>
                                  <path d="M12 6V12L16 14" stroke="#92400e" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                              </td>
                              <td>
                                <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 600; line-height: 1.4;">
                                  Offre valable jusqu'au ${new Date(data.valid_until).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                              </td>
                            </tr>
                          </table>
                        </div>
                      ` : ''}

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 40px 0 20px;">
                        <tr>
                          <td align="center">
                            <a href="${data.trackingUrl}/accept" style="display: inline-block; background: linear-gradient(135deg, #0E3A5D 0%, #165780 100%); color: #ffffff; text-decoration: none; padding: 18px 60px; border-radius: 10px; font-weight: 700; font-size: 17px; box-shadow: 0 6px 20px rgba(14, 58, 93, 0.3); letter-spacing: 0.3px;">
                              Accepter ce pack
                            </a>
                          </td>
                        </tr>
                      </table>

                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${data.trackingUrl}/decline" style="color: #94a3b8; text-decoration: none; font-size: 14px; font-weight: 500;">
                              Non merci, je ne suis pas intéressé(e)
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="text-align: center;">
                            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 12px;">
                              Une question sur ce pack ? Contactez-nous directement.
                            </p>
                            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                              © 2026 ScaNetwork. Tous droits réservés.
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
    `,
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not configured. Please add it in your Supabase project settings under Edge Functions > Manage secrets.');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Extract JWT token from header
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new Error('Invalid authorization header format');
    }

    // Create admin Supabase client for all operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify the user's JWT token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized: ' + (authError?.message || 'Invalid token'));
    }

    const body = await req.json() as EmailRequest;
    let { to, subject, html, templateType, metadata } = body;

    if (!to || (!subject && !templateType) || (!html && !templateType)) {
      throw new Error('Missing required fields: to, and either (subject + html) or templateType');
    }

    let emailSubject = subject;
    let emailHtml = html;

    // Generate tracking token for offer emails
    let trackingToken = null;
    if (templateType && (templateType === 'offer_individual' || templateType === 'offer_pack')) {
      trackingToken = crypto.randomUUID();

      // Add tracking URL to metadata
      const baseUrl = supabaseUrl.replace('/v1', '');
      metadata = {
        ...metadata,
        trackingUrl: `${baseUrl}/functions/v1/track-offer/${trackingToken}`,
      };
    }

    if (templateType && emailTemplates[templateType]) {
      const template = emailTemplates[templateType];
      // Handle subject as string or function
      emailSubject = typeof template.subject === 'function'
        ? template.subject(metadata || {})
        : template.subject;
      emailHtml = template.html(metadata || {});
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      const errorMessage = resendData.message || 'Failed to send email';

      await supabaseAdmin.from('email_logs').insert({
        user_id: user.id,
        to_email: to,
        from_email: FROM_EMAIL,
        subject: emailSubject,
        template_type: templateType || 'custom',
        status: 'failed',
        error_message: errorMessage,
        metadata: metadata,
        created_at: new Date().toISOString(),
      });

      throw new Error(errorMessage);
    }

    const { data: emailLog } = await supabaseAdmin.from('email_logs').insert({
      user_id: user.id,
      to_email: to,
      from_email: FROM_EMAIL,
      subject: emailSubject,
      template_type: templateType || 'custom',
      status: 'sent',
      resend_id: resendData.id,
      metadata: metadata,
      tracking_token: trackingToken,
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }).select().single();

    // Return tracking token for offer emails
    const response: any = {
      success: true,
      emailId: resendData.id,
      message: 'Email sent successfully',
    };

    if (trackingToken && emailLog) {
      response.trackingToken = trackingToken;
      response.emailLogId = emailLog.id;
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
