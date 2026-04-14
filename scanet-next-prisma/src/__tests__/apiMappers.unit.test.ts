import { describe, expect, it } from "vitest";

import { mapContact } from "@/lib/apiMappers";

describe("mapContact", () => {
  it("preserves compatibility fields expected by the migrated UI", () => {
    const result = mapContact({
      id: "contact-1",
      fullName: "Jean Dupont",
      linkedinUrl: "https://linkedin.com/in/jean",
      twitter: "https://x.com/jean",
      isFavorite: true,
      contactEvents: [{ event: { id: "event-1", name: "Salon Pro" } }],
      relationshipsFrom: [
        {
          id: "rel-1",
          relationshipType: "client",
          notes: null,
          relatedContact: {
            id: "contact-2",
            fullName: "Marie Martin",
            company: "Acme",
            jobTitle: "CEO",
            avatarUrl: null,
          },
        },
      ],
    });

    expect(result.full_name).toBe("Jean Dupont");
    expect(result.linkedin_url).toBe("https://linkedin.com/in/jean");
    expect(result.linkedin).toBe("https://linkedin.com/in/jean");
    expect(result.twitter).toBe("https://x.com/jean");
    expect(result.is_favorite).toBe(true);
    expect(result.events).toEqual([{ id: "event-1", name: "Salon Pro" }]);
    expect(result.relationships).toEqual([
      {
        id: "rel-1",
        relationship_type: "client",
        notes: null,
        related_contact: {
          id: "contact-2",
          full_name: "Marie Martin",
          company: "Acme",
          job_title: "CEO",
          avatar_url: null,
        },
      },
    ]);
  });

  it("fills missing optional compatibility fields with stable defaults", () => {
    const result = mapContact({
      id: "contact-1",
      fullName: "Jean Dupont",
    });

    expect(result.linkedin).toBe(null);
    expect(result.twitter).toBe(null);
    expect(result.is_favorite).toBe(false);
    expect(result.opportunity_currency).toBe(null);
    expect(result.opportunity_status).toBe(null);
  });
});