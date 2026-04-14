export interface Contact {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  status: string | null;
  source: string | null;
  notes: string | null;
  avatar_url: string | null;
  rating: number | null;
  tags: string[] | null;
  city: string | null;
  region: string | null;
  country: string | null;
  address: string | null;
  website: string | null;
  linkedin: string | null;
  industry: string | null;
  company_size: string | null;
  relationship: string | null;
  opportunity_amount: number | null;
  opportunity_currency: string | null;
  opportunity_status: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  image_url: string | null;
  qr_code_token: string | null;
  created_at: string;
  contact_count?: number;
}

export interface Interaction {
  id: string;
  contact_id: string;
  user_id: string;
  type: string;
  notes: string | null;
  date: string;
  created_at: string;
}

export interface Opportunity {
  id: string;
  contact_id: string;
  user_id: string;
  title: string;
  description: string | null;
  amount: number | null;
  currency: string;
  status: string;
  probability: number | null;
  expected_close_date: string | null;
  created_at: string;
  updated_at: string;
  contact?: Contact;
}

export interface Offer {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  type: string;
  status: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface FollowUp {
  id: string;
  user_id: string;
  contact_id: string;
  type: string;
  subject: string | null;
  message: string | null;
  status: string;
  scheduled_date: string;
  completed_date: string | null;
  priority: string;
  created_at: string;
  contact?: Contact;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: string;
  read: boolean;
  created_at: string;
}

export interface PersonalObjective {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  type: string;
  target_value: number;
  current_value: number;
  unit: string | null;
  period: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

export interface EmailSequence {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  steps?: EmailSequenceStep[];
  _count?: { enrollments: number };
}

export interface EmailSequenceStep {
  id: string;
  sequence_id: string;
  subject: string;
  body: string;
  delay_days: number;
  step_order: number;
  created_at: string;
}

export interface ScheduledEmail {
  id: string;
  user_id: string;
  subject: string;
  body: string;
  scheduled_at: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  recipients?: { contact: Contact }[];
}

export interface OfferPack {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  items?: { offer: Offer }[];
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  avatar_url: string | null;
  currency: string;
  timezone: string;
  language: string;
  created_at: string;
}

export interface Enterprise {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  industry: string | null;
  size: "startup" | "pme" | "eti" | "grande_entreprise" | null;
  vision: string | null;
  mission: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  enterprise_id: string;
  parent_team_id: string | null;
  name: string;
  description: string | null;
  color: string;
  manager_id: string | null;
  level: number;
  created_at: string;
  members_count?: number;
  sub_teams?: Team[];
  _count?: { members: number };
}

export interface TeamMember {
  id: string;
  team_id: string;
  contact_id: string;
  user_id: string;
  role: string | null;
  joined_at: string;
  is_active: boolean;
  contact?: Contact;
}

export interface CustomGroup {
  id: string;
  enterprise_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  created_by: string;
  created_at: string;
  members_count?: number;
}

export interface CustomGroupMember {
  id: string;
  group_id: string;
  contact_id: string;
  added_at: string;
  contact?: Contact;
}

export interface EnterpriseObjective {
  id: string;
  enterprise_id: string;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  priority: string;
  assigned_to?: string | null;
  created_by: string;
  created_at: string;
}

export interface TeamObjective {
  id: string;
  team_id: string;
  enterprise_objective_id: string | null;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
}

export interface MemberObjective {
  id: string;
  member_id: string;
  enterprise_id: string;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  priority: string;
  linked_objective_type: string | null;
  linked_objective_id: string | null;
  created_by: string;
  created_at: string;
}

export type ViewType =
  | "dashboard"
  | "contacts"
  | "events"
  | "followups"
  | "opportunities"
  | "offers"
  | "enterprise"
  | "settings";
export type ViewMode = "grid" | "list" | "photos";
export type SortOption =
  | "name_asc"
  | "name_desc"
  | "date_asc"
  | "date_desc"
  | "rating_asc"
  | "rating_desc";
