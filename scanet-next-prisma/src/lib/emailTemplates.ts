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

interface OpportunityWonData {
  userName: string;
  opportunityTitle: string;
  value: number;
  opportunityUrl?: string;
}

interface PasswordResetData {
  resetUrl: string;
}

interface OfferEmailData {
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  imageUrl?: string;
  features?: string[];
  validUntil?: string;
  terms?: string;
  billingType?: string;
  senderName: string;
  message: string;
  trackingUrl?: string;
  acceptUrl?: string;
  declineUrl?: string;
}

interface OfferPackEmailData {
  title: string;
  description?: string;
  totalPrice: number;
  totalOriginalPrice?: number;
  discountPercentage?: number;
  currency?: string;
  items: Array<{
    title: string;
    description?: string;
    price: number;
    quantity?: number;
  }>;
  validUntil?: string;
  senderName: string;
  message: string;
  trackingUrl?: string;
  acceptUrl?: string;
  declineUrl?: string;
}

interface FollowUpEmailData {
  subject: string;
  body: string;
  senderName?: string;
}

const baseEmailStyle = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
  .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .email-header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 20px; text-align: center; color: white; }
  .email-header h1 { margin: 0; font-size: 28px; font-weight: 700; }
  .email-body { padding: 40px 30px; }
  .email-body h2 { color: #1e40af; font-size: 24px; margin-top: 0; margin-bottom: 20px; }
  .email-body p { margin: 16px 0; font-size: 16px; }
  .button { display: inline-block; padding: 14px 32px; background-color: #2563eb; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
  .email-footer { background-color: #f9fafb; padding: 30px; text-align: center; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  .highlight-box { background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px 20px; margin: 20px 0; border-radius: 4px; }
  .success-header { background: linear-gradient(135deg, #059669 0%, #047857 100%); }
  .price-badge { background-color: #2563eb; color: white; padding: 8px 16px; border-radius: 20px; font-size: 24px; font-weight: 700; display: inline-block; }
  .feature-list { list-style: none; padding: 0; }
  .feature-list li { padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
  .feature-list li:before { content: "✓ "; color: #059669; font-weight: 700; }
`;

export const emailTemplates = {
  welcome: ({ userName, loginUrl }: WelcomeEmailData): string => `
    <!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Bienvenue</title><style>${baseEmailStyle}</style></head>
    <body><div class="email-container">
      <div class="email-header"><h1>🎉 Bienvenue !</h1></div>
      <div class="email-body">
        <h2>Bonjour ${userName},</h2>
        <p>Nous sommes ravis de vous accueillir sur <strong>ScaNetwork</strong> !</p>
        <p>Votre compte a été créé avec succès. Profitez de toutes les fonctionnalités de notre plateforme pour gérer vos contacts professionnels et événements.</p>
        <div class="highlight-box">
          <strong>🚀 Pour commencer :</strong>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Créez votre premier événement</li><li>Ajoutez vos contacts</li>
            <li>Suivez vos objectifs et KPIs</li><li>Gérez vos opportunités commerciales</li>
          </ul>
        </div>
        ${loginUrl ? `<div style="text-align: center;"><a href="${loginUrl}" class="button">Accéder à mon compte</a></div>` : ""}
        <p>L'équipe ScaNetwork</p>
      </div>
      <div class="email-footer"><p>Cet email a été envoyé depuis ScaNetwork</p></div>
    </div></body></html>
  `,

  opportunityWon: ({
    userName,
    opportunityTitle,
    value,
    opportunityUrl,
  }: OpportunityWonData): string => `
    <!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>${baseEmailStyle}</style></head>
    <body><div class="email-container">
      <div class="email-header success-header"><h1>🎉 Opportunité gagnée !</h1></div>
      <div class="email-body">
        <h2>Félicitations ${userName} !</h2>
        <p>Votre opportunité a été marquée comme gagnée :</p>
        <div class="highlight-box">
          <h3 style="margin: 0 0 10px 0; color: #059669;">${opportunityTitle}</h3>
          <p style="margin: 5px 0;">💰 <strong>Montant :</strong> ${value.toLocaleString("fr-FR")} €</p>
        </div>
        ${opportunityUrl ? `<div style="text-align: center;"><a href="${opportunityUrl}" class="button">Voir les détails</a></div>` : ""}
        <p>L'équipe ScaNetwork</p>
      </div>
      <div class="email-footer"><p>Cet email a été envoyé depuis ScaNetwork</p></div>
    </div></body></html>
  `,

  eventReminder: ({
    userName,
    eventName,
    eventDate,
    eventLocation,
    eventUrl,
  }: EventReminderData): string => `
    <!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>${baseEmailStyle}</style></head>
    <body><div class="email-container">
      <div class="email-header"><h1>📅 Rappel d'événement</h1></div>
      <div class="email-body">
        <h2>Bonjour ${userName},</h2>
        <p>Votre événement approche :</p>
        <div class="highlight-box">
          <h3 style="margin: 0 0 10px 0; color: #1e40af;">${eventName}</h3>
          <p style="margin: 5px 0;">📅 <strong>Date :</strong> ${eventDate}</p>
          ${eventLocation ? `<p style="margin: 5px 0;">📍 <strong>Lieu :</strong> ${eventLocation}</p>` : ""}
        </div>
        ${eventUrl ? `<div style="text-align: center;"><a href="${eventUrl}" class="button">Voir les détails</a></div>` : ""}
        <p>L'équipe ScaNetwork</p>
      </div>
      <div class="email-footer"><p>Cet email a été envoyé depuis ScaNetwork</p></div>
    </div></body></html>
  `,

  passwordReset: ({ resetUrl }: PasswordResetData): string => `
    <!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>${baseEmailStyle}</style></head>
    <body><div class="email-container">
      <div class="email-header"><h1>🔐 Réinitialisation du mot de passe</h1></div>
      <div class="email-body">
        <h2>Réinitialisation demandée</h2>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <div class="highlight-box">
          <p>⚠️ Ce lien expire dans <strong>1 heure</strong>.</p>
        </div>
        <div style="text-align: center;"><a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a></div>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        <p>L'équipe ScaNetwork</p>
      </div>
      <div class="email-footer"><p>Pour votre sécurité, ne partagez jamais ce lien.</p></div>
    </div></body></html>
  `,

  offerIndividual: (data: OfferEmailData): string => `
    <!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>${baseEmailStyle}</style></head>
    <body><div class="email-container">
      <div class="email-header"><h1>💼 Offre spéciale</h1></div>
      <div class="email-body">
        <p>${data.message}</p>
        ${data.imageUrl ? `<img src="${data.imageUrl}" alt="${data.title}" style="width:100%;border-radius:8px;margin:20px 0;">` : ""}
        <h2>${data.title}</h2>
        ${data.description ? `<p>${data.description}</p>` : ""}
        <div style="text-align: center; margin: 20px 0;">
          ${data.originalPrice ? `<span style="text-decoration:line-through;color:#9ca3af;font-size:18px;">${data.originalPrice} ${data.currency || "EUR"}</span> ` : ""}
          <span class="price-badge">${data.price} ${data.currency || "EUR"}</span>
          ${data.billingType && data.billingType !== "one_time" ? `<span style="color:#6b7280;font-size:14px;">/${data.billingType === "monthly" ? "mois" : data.billingType === "yearly" ? "an" : "trimestre"}</span>` : ""}
        </div>
        ${data.features && data.features.length > 0 ? `<ul class="feature-list">${data.features.map((f) => `<li>${f}</li>`).join("")}</ul>` : ""}
        ${data.acceptUrl ? `<div style="text-align: center;"><a href="${data.acceptUrl}" class="button">Accepter l'offre</a></div>` : ""}
        <p style="font-size:14px;color:#6b7280;">Proposé par ${data.senderName}</p>
      </div>
      <div class="email-footer"><p>Cet email a été envoyé depuis ScaNetwork</p></div>
      ${data.trackingUrl ? `<img src="${data.trackingUrl}" width="1" height="1" style="display:none;">` : ""}
    </div></body></html>
  `,

  offerPack: (data: OfferPackEmailData): string => `
    <!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>${baseEmailStyle}</style></head>
    <body><div class="email-container">
      <div class="email-header"><h1>📦 Pack spécial</h1></div>
      <div class="email-body">
        <p>${data.message}</p>
        <h2>${data.title}</h2>
        ${data.description ? `<p>${data.description}</p>` : ""}
        ${data.discountPercentage ? `<div style="text-align:center;"><span style="background:#059669;color:white;padding:6px 12px;border-radius:20px;font-weight:700;">-${data.discountPercentage}%</span></div>` : ""}
        <div style="text-align: center; margin: 20px 0;">
          ${data.totalOriginalPrice ? `<span style="text-decoration:line-through;color:#9ca3af;font-size:18px;">${data.totalOriginalPrice} ${data.currency || "EUR"}</span> ` : ""}
          <span class="price-badge">${data.totalPrice} ${data.currency || "EUR"}</span>
        </div>
        <h3>Contenu du pack :</h3>
        <ul class="feature-list">${data.items.map((item) => `<li>${item.title}${item.quantity && item.quantity > 1 ? ` (x${item.quantity})` : ""} - ${item.price} ${data.currency || "EUR"}</li>`).join("")}</ul>
        ${data.acceptUrl ? `<div style="text-align: center;"><a href="${data.acceptUrl}" class="button">Accepter le pack</a></div>` : ""}
        <p style="font-size:14px;color:#6b7280;">Proposé par ${data.senderName}</p>
      </div>
      <div class="email-footer"><p>Cet email a été envoyé depuis ScaNetwork</p></div>
      ${data.trackingUrl ? `<img src="${data.trackingUrl}" width="1" height="1" style="display:none;">` : ""}
    </div></body></html>
  `,

  followUp: (data: FollowUpEmailData): string => `
    <!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>${baseEmailStyle}</style></head>
    <body><div class="email-container">
      <div class="email-header"><h1>📧 ${data.subject}</h1></div>
      <div class="email-body">
        <div>${data.body}</div>
        ${data.senderName ? `<p style="margin-top:30px;"><strong>${data.senderName}</strong></p>` : ""}
      </div>
      <div class="email-footer"><p>Cet email a été envoyé depuis ScaNetwork</p></div>
    </div></body></html>
  `,

  contactAdded: ({
    userName,
    contactName,
    eventName,
    contactUrl,
  }: ContactAddedData): string => `
    <!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>${baseEmailStyle}</style></head>
    <body><div class="email-container">
      <div class="email-header"><h1>👤 Nouveau contact</h1></div>
      <div class="email-body">
        <h2>Bonjour ${userName},</h2>
        <p>Un nouveau contact a été ajouté à votre réseau :</p>
        <div class="highlight-box">
          <h3 style="margin:0;color:#1e40af;">${contactName}</h3>
          ${eventName ? `<p style="margin:5px 0;">📅 Rencontré lors de : ${eventName}</p>` : ""}
        </div>
        ${contactUrl ? `<div style="text-align: center;"><a href="${contactUrl}" class="button">Voir le contact</a></div>` : ""}
        <p>L'équipe ScaNetwork</p>
      </div>
      <div class="email-footer"><p>Cet email a été envoyé depuis ScaNetwork</p></div>
    </div></body></html>
  `,

  notification: ({
    userName,
    title,
    message,
    actionUrl,
    actionText,
  }: NotificationEmailData): string => `
    <!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><style>${baseEmailStyle}</style></head>
    <body><div class="email-container">
      <div class="email-header"><h1>🔔 ${title}</h1></div>
      <div class="email-body">
        <h2>Bonjour ${userName},</h2>
        <p>${message}</p>
        ${actionUrl ? `<div style="text-align: center;"><a href="${actionUrl}" class="button">${actionText || "Voir"}</a></div>` : ""}
        <p>L'équipe ScaNetwork</p>
      </div>
      <div class="email-footer"><p>Cet email a été envoyé depuis ScaNetwork</p></div>
    </div></body></html>
  `,
};
