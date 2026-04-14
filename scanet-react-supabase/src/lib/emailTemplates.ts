interface WelcomeEmailData {
  userName: string;
  loginUrl?: string;
}

interface EventReminderData {
  userName: string;
  eventName: string;
  eventDate: string;
  eventLocation?: string;
  eventUrl?: string;
}

interface ContactAddedData {
  userName: string;
  contactName: string;
  eventName?: string;
  contactUrl?: string;
}

interface NotificationEmailData {
  userName: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

const baseEmailStyle = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f5f5f5;
    margin: 0;
    padding: 0;
  }
  .email-container {
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  .email-header {
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    padding: 40px 20px;
    text-align: center;
    color: white;
  }
  .email-header h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
  }
  .email-body {
    padding: 40px 30px;
  }
  .email-body h2 {
    color: #1e40af;
    font-size: 24px;
    margin-top: 0;
    margin-bottom: 20px;
  }
  .email-body p {
    margin: 16px 0;
    font-size: 16px;
  }
  .button {
    display: inline-block;
    padding: 14px 32px;
    background-color: #2563eb;
    color: white !important;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    margin: 20px 0;
    transition: background-color 0.3s;
  }
  .button:hover {
    background-color: #1e40af;
  }
  .email-footer {
    background-color: #f9fafb;
    padding: 30px;
    text-align: center;
    font-size: 14px;
    color: #6b7280;
    border-top: 1px solid #e5e7eb;
  }
  .divider {
    height: 1px;
    background-color: #e5e7eb;
    margin: 30px 0;
  }
  .highlight-box {
    background-color: #eff6ff;
    border-left: 4px solid #2563eb;
    padding: 16px 20px;
    margin: 20px 0;
    border-radius: 4px;
  }
`;

export const emailTemplates = {
  welcome: ({ userName, loginUrl }: WelcomeEmailData): string => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenue sur Contact Platform</title>
      <style>${baseEmailStyle}</style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>🎉 Bienvenue !</h1>
        </div>
        <div class="email-body">
          <h2>Bonjour ${userName},</h2>
          <p>Nous sommes ravis de vous accueillir sur <strong>Contact Platform</strong> !</p>
          <p>Votre compte a été créé avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités de notre plateforme pour gérer vos contacts professionnels et événements.</p>

          <div class="highlight-box">
            <strong>🚀 Pour commencer :</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Créez votre premier événement</li>
              <li>Ajoutez vos contacts</li>
              <li>Suivez vos objectifs et KPIs</li>
              <li>Gérez vos opportunités commerciales</li>
            </ul>
          </div>

          ${loginUrl ? `
          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Accéder à mon compte</a>
          </div>
          ` : ''}

          <p>Si vous avez des questions ou besoin d'aide, n'hésitez pas à nous contacter.</p>
          <p>Bonne utilisation !</p>
          <p style="margin-top: 30px;">
            <strong>L'équipe Contact Platform</strong>
          </p>
        </div>
        <div class="email-footer">
          <p>Cet email a été envoyé depuis Contact Platform</p>
          <p style="margin-top: 10px;">
            <a href="#" style="color: #2563eb; text-decoration: none;">Se désabonner</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `,

  eventReminder: ({ userName, eventName, eventDate, eventLocation, eventUrl }: EventReminderData): string => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rappel d'événement</title>
      <style>${baseEmailStyle}</style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>📅 Rappel d'événement</h1>
        </div>
        <div class="email-body">
          <h2>Bonjour ${userName},</h2>
          <p>Nous vous rappelons que votre événement approche :</p>

          <div class="highlight-box">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">${eventName}</h3>
            <p style="margin: 5px 0;">📅 <strong>Date :</strong> ${eventDate}</p>
            ${eventLocation ? `<p style="margin: 5px 0;">📍 <strong>Lieu :</strong> ${eventLocation}</p>` : ''}
          </div>

          <p>Assurez-vous d'être prêt pour profiter au maximum de cet événement !</p>

          ${eventUrl ? `
          <div style="text-align: center;">
            <a href="${eventUrl}" class="button">Voir les détails</a>
          </div>
          ` : ''}

          <p style="margin-top: 30px;">
            <strong>L'équipe Contact Platform</strong>
          </p>
        </div>
        <div class="email-footer">
          <p>Cet email a été envoyé depuis Contact Platform</p>
          <p style="margin-top: 10px;">
            <a href="#" style="color: #2563eb; text-decoration: none;">Gérer mes préférences</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `,

  contactAdded: ({ userName, contactName, eventName, contactUrl }: ContactAddedData): string => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nouveau contact ajouté</title>
      <style>${baseEmailStyle}</style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>👤 Nouveau contact</h1>
        </div>
        <div class="email-body">
          <h2>Bonjour ${userName},</h2>
          <p>Un nouveau contact a été ajouté à votre réseau :</p>

          <div class="highlight-box">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">${contactName}</h3>
            ${eventName ? `<p style="margin: 5px 0;">🎯 <strong>Événement :</strong> ${eventName}</p>` : ''}
          </div>

          <p>Vous pouvez maintenant consulter ses informations et planifier un suivi.</p>

          ${contactUrl ? `
          <div style="text-align: center;">
            <a href="${contactUrl}" class="button">Voir le contact</a>
          </div>
          ` : ''}

          <p style="margin-top: 30px;">
            <strong>L'équipe Contact Platform</strong>
          </p>
        </div>
        <div class="email-footer">
          <p>Cet email a été envoyé depuis Contact Platform</p>
          <p style="margin-top: 10px;">
            <a href="#" style="color: #2563eb; text-decoration: none;">Gérer mes préférences</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `,

  notification: ({ userName, title, message, actionUrl, actionText }: NotificationEmailData): string => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>${baseEmailStyle}</style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>🔔 Notification</h1>
        </div>
        <div class="email-body">
          <h2>Bonjour ${userName},</h2>

          <div class="highlight-box">
            <h3 style="margin: 0 0 10px 0; color: #1e40af;">${title}</h3>
            <p style="margin: 5px 0;">${message}</p>
          </div>

          ${actionUrl && actionText ? `
          <div style="text-align: center;">
            <a href="${actionUrl}" class="button">${actionText}</a>
          </div>
          ` : ''}

          <p style="margin-top: 30px;">
            <strong>L'équipe Contact Platform</strong>
          </p>
        </div>
        <div class="email-footer">
          <p>Cet email a été envoyé depuis Contact Platform</p>
          <p style="margin-top: 10px;">
            <a href="#" style="color: #2563eb; text-decoration: none;">Gérer mes préférences</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `,

  passwordReset: (userName: string, resetUrl: string): string => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Réinitialisation de mot de passe</title>
      <style>${baseEmailStyle}</style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>🔐 Réinitialisation de mot de passe</h1>
        </div>
        <div class="email-body">
          <h2>Bonjour ${userName},</h2>
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>

          <div class="highlight-box">
            <p style="margin: 0;"><strong>⚠️ Important :</strong> Ce lien est valable pendant 1 heure.</p>
          </div>

          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
          </div>

          <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>

          <p style="margin-top: 30px;">
            <strong>L'équipe Contact Platform</strong>
          </p>
        </div>
        <div class="email-footer">
          <p>Cet email a été envoyé depuis Contact Platform</p>
          <p style="margin-top: 10px; color: #ef4444;">
            <strong>Ne partagez jamais ce lien avec quiconque</strong>
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
};

export type EmailTemplateType = keyof typeof emailTemplates;
