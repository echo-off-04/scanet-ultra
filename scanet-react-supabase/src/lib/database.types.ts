export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          company: string | null;
          job_title: string | null;
          avatar_url: string | null;
          preferred_currency: string | null;
          phone: string | null;
          bio: string | null;
          website: string | null;
          linkedin: string | null;
          country: string | null;
          city: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          company?: string | null;
          job_title?: string | null;
          avatar_url?: string | null;
          preferred_currency?: string | null;
          phone?: string | null;
          bio?: string | null;
          website?: string | null;
          linkedin?: string | null;
          country?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          company?: string | null;
          job_title?: string | null;
          avatar_url?: string | null;
          preferred_currency?: string | null;
          phone?: string | null;
          bio?: string | null;
          website?: string | null;
          linkedin?: string | null;
          country?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          job_title: string | null;
          linkedin_url: string | null;
          avatar_url: string | null;
          rating: number | null;
          tags: string[];
          notes: string | null;
          status: "lead" | "prospect" | "client" | "partner" | "collaborateur" | "ami" | "fournisseur";
          source: "event" | "referral" | "cold_outreach" | "team" | null;
          is_member: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          job_title?: string | null;
          linkedin_url?: string | null;
          avatar_url?: string | null;
          rating?: number | null;
          tags?: string[];
          notes?: string | null;
          status?: "lead" | "prospect" | "client" | "partner";
          source?: "event" | "referral" | "cold_outreach" | "team" | null;
          is_member?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          job_title?: string | null;
          linkedin_url?: string | null;
          avatar_url?: string | null;
          rating?: number | null;
          tags?: string[];
          notes?: string | null;
          status?: "lead" | "prospect" | "client" | "partner";
          source?: "event" | "referral" | "cold_outreach" | "team" | null;
          is_member?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          event_type: "salon" | "meeting" | "conference" | "networking";
          location: string | null;
          event_date: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          event_type?: "salon" | "meeting" | "conference" | "networking";
          location?: string | null;
          event_date?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          event_type?: "salon" | "meeting" | "conference" | "networking";
          location?: string | null;
          event_date?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      interactions: {
        Row: {
          id: string;
          contact_id: string;
          user_id: string;
          interaction_type: "call" | "email" | "meeting" | "note";
          subject: string | null;
          description: string | null;
          interaction_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          contact_id: string;
          user_id: string;
          interaction_type?: "call" | "email" | "meeting" | "note";
          subject?: string | null;
          description?: string | null;
          interaction_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          contact_id?: string;
          user_id?: string;
          interaction_type?: "call" | "email" | "meeting" | "note";
          subject?: string | null;
          description?: string | null;
          interaction_date?: string;
          created_at?: string;
        };
      };
      follow_ups: {
        Row: {
          id: string;
          contact_id: string;
          user_id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          completed: boolean;
          priority: "low" | "medium" | "high";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          contact_id: string;
          user_id: string;
          title: string;
          description?: string | null;
          due_date?: string | null;
          completed?: boolean;
          priority?: "low" | "medium" | "high";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          contact_id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          completed?: boolean;
          priority?: "low" | "medium" | "high";
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

// Types pour le module Entreprise
export interface Enterprise {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  industry: string | null;
  size: "startup" | "pme" | "eti" | "grande_entreprise" | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
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
  updated_at: string;
  // Relations
  parent_team?: Team | null;
  sub_teams?: Team[];
  members?: TeamMember[];
  members_count?: number;
}

export interface TeamMember {
  id: string;
  team_id: string;
  contact_id: string;
  user_id: string;
  role: string | null;
  joined_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  contact?: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    job_title: string | null;
    avatar_url: string | null;
    status: string;
  };
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
  updated_at: string;
  // Relations
  members?: CustomGroupMember[];
  members_count?: number;
}

export interface CustomGroupMember {
  id: string;
  group_id: string;
  contact_id: string;
  added_at: string;
  // Relations
  contact?: {
    id: string;
    full_name: string;
    email: string | null;
    avatar_url: string | null;
    company: string | null;
    job_title: string | null;
  };
}

export interface EnterpriseObjective {
  id: string;
  enterprise_id: string;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number;
  unit: "currency" | "percentage" | "number" | "events" | "contacts" | null;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  status: "not_started" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "critical";
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TeamObjective {
  id: string;
  team_id: string;
  enterprise_objective_id: string | null;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number;
  unit: "currency" | "percentage" | "number" | "events" | "contacts" | null;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  status: "not_started" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "critical";
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Relations
  assigned_contact?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  enterprise_objective?: EnterpriseObjective;
}

export interface TeamEvent {
  id: string;
  team_id: string;
  event_id: string;
  created_at: string;
  // Relations
  event?: {
    id: string;
    name: string;
    event_type: string;
    event_date: string | null;
    location: string | null;
  };
}

// Types pour les groupes de contacts
export interface ContactGroup {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  // Relations
  members?: ContactGroupMember[];
  members_count?: number;
}

export interface ContactGroupMember {
  id: string;
  group_id: string;
  contact_id: string;
  added_at: string;
  // Relations
  contact?: {
    id: string;
    full_name: string;
    email: string | null;
    avatar_url: string | null;
    company: string | null;
    job_title: string | null;
    is_member: boolean;
  };
}

// Types pour les envois d'offres
export interface OfferSend {
  id: string;
  user_id: string;
  offer_id: string | null;
  pack_id: string | null;
  contact_id: string | null;
  contact_group_id: string | null;
  sent_at: string;
  status: 'sent' | 'viewed' | 'accepted' | 'declined';
  notes: string | null;
  created_at: string;
}
