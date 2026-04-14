import { describe, expect, it } from "vitest";

import { extractScanCardImages, normalizeScanCardData } from "@/lib/scanCard";

describe("extractScanCardImages", () => {
  it("accepts the legacy image payload shape", () => {
    expect(
      extractScanCardImages({
        image: "data:image/jpeg;base64,front",
        backImage: "data:image/jpeg;base64,back",
      }),
    ).toEqual({
      frontImage: "data:image/jpeg;base64,front",
      backImage: "data:image/jpeg;base64,back",
    });
  });

  it("accepts the migrated snake_case payload shape", () => {
    expect(
      extractScanCardImages({
        front_image: "data:image/webp;base64,front",
        back_image: "data:image/webp;base64,back",
      }),
    ).toEqual({
      frontImage: "data:image/webp;base64,front",
      backImage: "data:image/webp;base64,back",
    });
  });
});

describe("normalizeScanCardData", () => {
  it("preserves camelCase output from the AI route", () => {
    expect(
      normalizeScanCardData({
        firstName: "Jean",
        lastName: "Dupont",
        email: "jean@example.com",
        jobTitle: "Directeur",
        website: "https://example.com",
      }),
    ).toEqual({
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean@example.com",
      phone: "",
      company: "",
      jobTitle: "Directeur",
      website: "https://example.com",
      address: "",
      city: "",
      country: "",
      notes: "",
      linkedin: "",
    });
  });

  it("derives first and last name from legacy full_name fields", () => {
    expect(
      normalizeScanCardData({
        full_name: "Marie Curie",
        job_title: "Chercheuse",
        linkedin_url: "https://linkedin.com/in/marie-curie",
      }),
    ).toEqual({
      firstName: "Marie",
      lastName: "Curie",
      email: "",
      phone: "",
      company: "",
      jobTitle: "Chercheuse",
      website: "https://linkedin.com/in/marie-curie",
      address: "",
      city: "",
      country: "",
      notes: "",
      linkedin: "https://linkedin.com/in/marie-curie",
    });
  });
});
