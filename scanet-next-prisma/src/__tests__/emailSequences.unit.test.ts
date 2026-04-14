import { describe, expect, it } from "vitest";

import {
  buildTemplateVariables,
  contactMatchesSequence,
  normalizeSequencePayload,
  normalizeSequenceState,
  renderTemplate,
} from "@/lib/emailSequences";

describe("emailSequences helpers", () => {
  it("normalizes active sequence payload from legacy fields", () => {
    const payload = normalizeSequencePayload({
      name: "Lead nurture",
      description: "Follow up",
      trigger_status: "lead",
      source_filter: "event",
      exclude_statuses: ["client"],
    });

    expect(payload).toMatchObject({
      name: "Lead nurture",
      description: "Follow up",
      triggerType: "on_status",
      triggerStatus: "lead",
      sourceFilter: "event",
      excludeStatuses: ["client"],
      isActive: true,
      status: "active",
    });
  });

  it("derives paused state from status", () => {
    expect(normalizeSequenceState({ status: "paused" })).toEqual({
      isActive: false,
      status: "paused",
    });
  });

  it("matches a contact against an active sequence", () => {
    expect(
      contactMatchesSequence(
        { status: "lead", source: "event" },
        {
          isActive: true,
          status: "active",
          triggerType: "on_status",
          triggerStatus: "lead",
          sourceFilter: "event",
          excludeStatuses: [],
        },
      ),
    ).toBe(true);
  });

  it("renders both french and english template variables", () => {
    const variables = buildTemplateVariables({
      contact: {
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        company: "Analytical Engines",
        jobTitle: "Mathematician",
        source: "event",
      },
      senderName: "Charles Babbage",
      senderCompany: "Difference Engine Ltd",
    });

    const rendered = renderTemplate(
      "Bonjour {{prenom}} / {{first_name}} - {{entreprise}} - {{sender_name}}",
      variables,
    );

    expect(rendered).toBe(
      "Bonjour Ada / Ada - Analytical Engines - Charles Babbage",
    );
  });
});