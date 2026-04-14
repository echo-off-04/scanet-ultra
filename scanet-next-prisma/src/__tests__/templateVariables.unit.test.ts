import { describe, it, expect } from "vitest";

function replaceTemplateVariables(
  text: string,
  context: Record<string, string>,
  senderProfile: Record<string, string> | null,
): string {
  let result = text;
  const contactName = context.contact_name || "";
  const firstName = contactName.split(" ")[0] || contactName;

  result = result.replace(/\{\{prenom\}\}/g, firstName);
  result = result.replace(/\{\{nom_complet\}\}/g, contactName);
  result = result.replace(/\{\{entreprise\}\}/g, context.contact_company || "");
  result = result.replace(/\{\{evenement\}\}/g, context.event_name || "");
  result = result.replace(/\{\{date_rencontre\}\}/g, context.event_date || "");
  result = result.replace(/\{\{source\}\}/g, context.source || "");
  result = result.replace(/\{\{mon_nom\}\}/g, senderProfile?.full_name || "");

  return result;
}

describe("replaceTemplateVariables", () => {
  const fullContext: Record<string, string> = {
    contact_name: "Jean Dupont",
    contact_email: "jean@example.com",
    contact_phone: "+33612345678",
    contact_company: "Acme Corp",
    source: "event",
    event_name: "Tech Summit 2026",
    event_date: "15/02/2026",
  };

  const senderProfile = {
    full_name: "Pierre Martin",
    company: "MonEntreprise",
  };

  it("replaces {{prenom}} with first name extracted from full name", () => {
    const result = replaceTemplateVariables(
      "Bonjour {{prenom}}",
      fullContext,
      null,
    );
    expect(result).toBe("Bonjour Jean");
  });

  it("replaces {{nom_complet}} with full name", () => {
    const result = replaceTemplateVariables(
      "Contact: {{nom_complet}}",
      fullContext,
      null,
    );
    expect(result).toBe("Contact: Jean Dupont");
  });

  it("replaces {{entreprise}} with company name", () => {
    const result = replaceTemplateVariables(
      "Chez {{entreprise}}",
      fullContext,
      null,
    );
    expect(result).toBe("Chez Acme Corp");
  });

  it("replaces {{evenement}} with event name", () => {
    const result = replaceTemplateVariables(
      "Lors de {{evenement}}",
      fullContext,
      null,
    );
    expect(result).toBe("Lors de Tech Summit 2026");
  });

  it("replaces {{date_rencontre}} with event date", () => {
    const result = replaceTemplateVariables(
      "Le {{date_rencontre}}",
      fullContext,
      null,
    );
    expect(result).toBe("Le 15/02/2026");
  });

  it("replaces {{source}} with source", () => {
    const result = replaceTemplateVariables(
      "Via {{source}}",
      fullContext,
      null,
    );
    expect(result).toBe("Via event");
  });

  it("replaces {{mon_nom}} with sender profile name", () => {
    const result = replaceTemplateVariables(
      "De la part de {{mon_nom}}",
      fullContext,
      senderProfile,
    );
    expect(result).toBe("De la part de Pierre Martin");
  });

  it("replaces all variables in a complete email template", () => {
    const template =
      "Ravi de vous avoir rencontre, {{prenom}}\n\nBonjour {{prenom}},\n\nSuite a notre rencontre lors de {{evenement}} le {{date_rencontre}}, je souhaitais vous recontacter.\n\nCordialement,\n{{mon_nom}}";
    const result = replaceTemplateVariables(
      template,
      fullContext,
      senderProfile,
    );
    expect(result).toContain("Ravi de vous avoir rencontre, Jean");
    expect(result).toContain("Bonjour Jean,");
    expect(result).toContain("Tech Summit 2026");
    expect(result).toContain("15/02/2026");
    expect(result).toContain("Pierre Martin");
    expect(result).not.toContain("{{");
  });

  it("replaces multiple occurrences of the same variable", () => {
    const result = replaceTemplateVariables(
      "{{prenom}} et encore {{prenom}}",
      fullContext,
      null,
    );
    expect(result).toBe("Jean et encore Jean");
  });

  it("handles empty context gracefully (all variables become empty)", () => {
    const result = replaceTemplateVariables(
      "Bonjour {{prenom}}, de {{entreprise}}",
      {},
      null,
    );
    expect(result).toBe("Bonjour , de ");
  });

  it("handles missing sender profile gracefully", () => {
    const result = replaceTemplateVariables(
      "Signe: {{mon_nom}}",
      fullContext,
      null,
    );
    expect(result).toBe("Signe: ");
  });

  it("extracts first name correctly from single-word name", () => {
    const context = { ...fullContext, contact_name: "Marie" };
    const result = replaceTemplateVariables("{{prenom}}", context, null);
    expect(result).toBe("Marie");
  });

  it("extracts first name correctly from multi-word name", () => {
    const context = {
      ...fullContext,
      contact_name: "Jean-Pierre De La Fontaine",
    };
    const result = replaceTemplateVariables("{{prenom}}", context, null);
    expect(result).toBe("Jean-Pierre");
  });

  it("handles empty contact_name", () => {
    const context = { ...fullContext, contact_name: "" };
    const result = replaceTemplateVariables(
      "Bonjour {{prenom}}",
      context,
      null,
    );
    expect(result).toBe("Bonjour ");
  });

  it("does not replace non-template text", () => {
    const result = replaceTemplateVariables(
      "Simple text with no variables",
      fullContext,
      senderProfile,
    );
    expect(result).toBe("Simple text with no variables");
  });

  it("handles unknown template-like patterns without replacement", () => {
    const result = replaceTemplateVariables(
      "{{unknown}} stays",
      fullContext,
      null,
    );
    expect(result).toBe("{{unknown}} stays");
  });
});

describe("buildWhatsAppLink (logic replica)", () => {
  function buildWhatsAppLink(
    phone: string,
    messageTemplate: string,
    context?: Record<string, string>,
  ): string {
    let message = messageTemplate;
    if (context) {
      const contactName = context.contact_name || "";
      const firstName = contactName.split(" ")[0] || contactName;
      message = message.replace(/\{\{prenom\}\}/g, firstName);
      message = message.replace(/\{\{nom_complet\}\}/g, contactName);
      message = message.replace(
        /\{\{entreprise\}\}/g,
        context.contact_company || "",
      );
      message = message.replace(/\{\{evenement\}\}/g, context.event_name || "");
      message = message.replace(
        /\{\{date_rencontre\}\}/g,
        context.event_date || "",
      );
      message = message.replace(/\{\{source\}\}/g, context.source || "");
    }
    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }

  const context: Record<string, string> = {
    contact_name: "Marie Lambert",
    contact_company: "TechCo",
    event_name: "Salon Pro",
    event_date: "10/01/2026",
    source: "event",
  };

  it("generates valid WhatsApp link", () => {
    const link = buildWhatsAppLink("+33612345678", "Hello", context);
    expect(link).toMatch(/^https:\/\/wa\.me\//);
  });

  it("cleans phone number (removes spaces, dashes, parens)", () => {
    const link = buildWhatsAppLink("+33 6 12 34 56 78", "Hi", context);
    expect(link).toContain("wa.me/+33612345678");
  });

  it("replaces template variables in message", () => {
    const link = buildWhatsAppLink(
      "+33600000000",
      "Bonjour {{prenom}} de {{entreprise}}",
      context,
    );
    const decoded = decodeURIComponent(link.split("text=")[1]);
    expect(decoded).toBe("Bonjour Marie de TechCo");
  });

  it("works without context", () => {
    const link = buildWhatsAppLink("+33600000000", "Hello world");
    expect(link).toContain("text=Hello%20world");
  });

  it("encodes message content for URL", () => {
    const link = buildWhatsAppLink(
      "+33600000000",
      "Bonjour! Comment allez-vous?",
      context,
    );
    expect(link).toContain("text=");
    const decoded = decodeURIComponent(link.split("text=")[1]);
    expect(decoded).toBe("Bonjour! Comment allez-vous?");
  });
});
