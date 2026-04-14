export interface NormalizedScanCardData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  website: string;
  address: string;
  city: string;
  country: string;
  notes: string;
  linkedin: string;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function splitFullName(fullName: string) {
  const normalized = fullName.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return { firstName: "", lastName: "" };
  }

  const [firstName, ...rest] = normalized.split(" ");

  return {
    firstName,
    lastName: rest.join(" "),
  };
}

export function extractScanCardImages(payload: unknown) {
  const input =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};

  const frontImage =
    readString(input.frontImage) ||
    readString(input.front_image) ||
    readString(input.image);
  const backImage =
    readString(input.backImage) ||
    readString(input.back_image) ||
    readString(input.back);

  return {
    frontImage,
    backImage,
  };
}

export function normalizeScanCardData(
  payload: unknown,
): NormalizedScanCardData {
  const input =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};

  const fullName = readString(input.fullName) || readString(input.full_name);
  const derivedName = splitFullName(fullName);

  return {
    firstName: readString(input.firstName) || derivedName.firstName,
    lastName: readString(input.lastName) || derivedName.lastName,
    email: readString(input.email),
    phone: readString(input.phone),
    company: readString(input.company),
    jobTitle: readString(input.jobTitle) || readString(input.job_title),
    website:
      readString(input.website) ||
      readString(input.site) ||
      readString(input.linkedin_url),
    address: readString(input.address),
    city: readString(input.city),
    country: readString(input.country),
    notes: readString(input.notes),
    linkedin:
      readString(input.linkedin) ||
      readString(input.linkedinUrl) ||
      readString(input.linkedin_url),
  };
}
