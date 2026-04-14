/**
 * Generic camelCase to snake_case converter for API responses.
 * Recursively transforms all object keys from camelCase to snake_case.
 */

function camelToSnakeKey(key: string): string {
  // Don't convert keys that start with underscore (like _count)
  if (key.startsWith("_")) return key;
  return key.replace(/([A-Z])/g, "_$1").toLowerCase();
}

export function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (typeof obj !== "object") return obj;

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnakeKey(key);
    result[snakeKey] = toSnakeCase(value);
  }
  return result;
}

/**
 * Maps Prisma camelCase models to snake_case for frontend compatibility.
 */

export function mapContact(c: any) {
  const mapped = toSnakeCase(c);
  // Add computed/aliased fields
  if (c.linkedinUrl !== undefined) mapped.linkedin = c.linkedinUrl;
  if (mapped.linkedin === undefined) mapped.linkedin = mapped.linkedin_url ?? null;
  if (mapped.twitter === undefined) mapped.twitter = null;
  if (mapped.is_favorite === undefined) mapped.is_favorite = false;
  if (mapped.opportunity_currency === undefined) {
    mapped.opportunity_currency = null;
  }
  if (mapped.opportunity_status === undefined) {
    mapped.opportunity_status = null;
  }
  if (c.contactEvents) {
    mapped.events = c.contactEvents.map((ce: any) => ({
      id: ce.event?.id,
      name: ce.event?.name,
    }));
  }
  if (c.relationshipsFrom) {
    mapped.relationships = c.relationshipsFrom.map((relationship: any) => ({
      id: relationship.id,
      relationship_type: relationship.relationshipType,
      notes: relationship.notes ?? null,
      related_contact: relationship.relatedContact
        ? {
            id: relationship.relatedContact.id,
            full_name: relationship.relatedContact.fullName,
            company: relationship.relatedContact.company ?? null,
            job_title: relationship.relatedContact.jobTitle ?? null,
            avatar_url: relationship.relatedContact.avatarUrl ?? null,
          }
        : null,
    }));
  }
  if (c._count) {
    mapped.opportunities_count = c._count.opportunities;
    mapped.follow_ups_count = c._count.followUps;
    mapped.interactions_count = c._count.interactions;
    mapped.contact_count = c._count.contactEvents;
  }
  return mapped;
}

export function mapEvent(e: any) {
  const mapped = toSnakeCase(e);
  if (e._count) {
    mapped.contact_count = e._count.contactEvents ?? 0;
  }
  return mapped;
}

export function mapOpportunity(o: any) {
  return toSnakeCase(o);
}

export function mapOffer(o: any) {
  const mapped = toSnakeCase(o);
  // Component expects is_active boolean, Prisma uses status enum
  if (o.status !== undefined) {
    mapped.is_active = o.status === "active";
  }
  return mapped;
}

export function mapNotification(n: any) {
  return toSnakeCase(n);
}

export function mapFollowUp(f: any) {
  return toSnakeCase(f);
}
