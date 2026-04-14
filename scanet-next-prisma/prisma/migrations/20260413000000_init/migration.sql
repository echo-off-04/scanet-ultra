-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('lead', 'prospect', 'client', 'partner', 'collaborateur', 'ami', 'fournisseur');

-- CreateEnum
CREATE TYPE "ContactSource" AS ENUM ('event', 'referral', 'cold_outreach', 'team');

-- CreateEnum
CREATE TYPE "event_type_enum" AS ENUM ('salon', 'meeting', 'conference', 'networking', 'seminar', 'gala', 'meetup');

-- CreateEnum
CREATE TYPE "event_format_enum" AS ENUM ('presentiel', 'online', 'hybride');

-- CreateEnum
CREATE TYPE "event_status_enum" AS ENUM ('upcoming', 'ongoing', 'completed');

-- CreateEnum
CREATE TYPE "EventObjectiveType" AS ENUM ('primary', 'secondary');

-- CreateEnum
CREATE TYPE "MetricType" AS ENUM ('people_count', 'opportunity_value', 'quality_score');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('call', 'email', 'message', 'meeting', 'other');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('call', 'email', 'meeting', 'note');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('prospect', 'negotiation', 'won', 'lost');

-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('one_time', 'monthly', 'yearly', 'quarterly');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "OfferSendStatus" AS ENUM ('sent', 'viewed', 'accepted', 'declined');

-- CreateEnum
CREATE TYPE "ScheduledEmailStatus" AS ENUM ('pending', 'sent', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "SequenceTriggerType" AS ENUM ('manual', 'on_event', 'on_status');

-- CreateEnum
CREATE TYPE "SequenceStatus" AS ENUM ('draft', 'active', 'paused', 'archived');

-- CreateEnum
CREATE TYPE "StepChannel" AS ENUM ('email', 'whatsapp');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('active', 'paused', 'completed');

-- CreateEnum
CREATE TYPE "EmailLogStatus" AS ENUM ('sent', 'failed');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('contacts', 'opportunities', 'follow_ups', 'events', 'team_activity', 'system');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "ObjectiveType" AS ENUM ('revenue', 'new_contacts', 'contacts_by_status', 'win_rate', 'participation_rate');

-- CreateEnum
CREATE TYPE "ObjectiveUnit" AS ENUM ('currency', 'number', 'percentage');

-- CreateEnum
CREATE TYPE "ObjectiveStatus" AS ENUM ('active', 'achieved', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('day', 'week', 'month', 'year', 'all_time', 'custom');

-- CreateEnum
CREATE TYPE "EnterpriseSize" AS ENUM ('startup', 'pme', 'eti', 'grande_entreprise');

-- CreateEnum
CREATE TYPE "EnterpriseObjectiveStatus" AS ENUM ('not_started', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "EnterpriseObjectivePriority" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashed_password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "company" TEXT,
    "job_title" TEXT,
    "avatar_url" TEXT,
    "preferred_currency" TEXT DEFAULT 'EUR',
    "phone" TEXT,
    "bio" TEXT,
    "website" TEXT,
    "linkedin" TEXT,
    "country" TEXT,
    "city" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "job_title" TEXT,
    "linkedin_url" TEXT,
    "avatar_url" TEXT,
    "rating" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "status" "ContactStatus" NOT NULL DEFAULT 'lead',
    "source" "ContactSource",
    "is_member" BOOLEAN NOT NULL DEFAULT false,
    "city" TEXT,
    "region" TEXT,
    "country" TEXT,
    "industry" TEXT,
    "company_size" TEXT,
    "address" TEXT,
    "website" TEXT,
    "relationship" TEXT,
    "opportunity_amount" DOUBLE PRECISION,
    "follow_up_required" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT DEFAULT 'networking',
    "event_type" TEXT DEFAULT 'presentiel',
    "status" TEXT DEFAULT 'upcoming',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "location" TEXT,
    "image_url" TEXT,
    "event_date" TIMESTAMP(3),
    "target_participants" INTEGER DEFAULT 0,
    "actual_participants" INTEGER DEFAULT 0,
    "people_approached" INTEGER DEFAULT 0,
    "primary_objective" TEXT,
    "secondary_objectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_audience" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "leads_generated" INTEGER NOT NULL DEFAULT 0,
    "contacts_added" INTEGER NOT NULL DEFAULT 0,
    "conversion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "performance_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "budget" DOUBLE PRECISION DEFAULT 0,
    "revenue" DOUBLE PRECISION DEFAULT 0,
    "qr_code_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_events" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "source" TEXT DEFAULT 'event',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_objectives" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "objective_type" "EventObjectiveType" NOT NULL DEFAULT 'primary',
    "metric_type" "MetricType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_value" DOUBLE PRECISION NOT NULL,
    "current_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "achieved" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_notes" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_activities" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activity_type" "ActivityType" NOT NULL,
    "description" TEXT,
    "activity_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_relationships" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "related_contact_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "relationship_type" TEXT NOT NULL DEFAULT 'contact',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "interaction_type" "InteractionType" NOT NULL DEFAULT 'note',
    "subject" TEXT,
    "description" TEXT,
    "interaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_ups" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "priority" "Priority" NOT NULL DEFAULT 'medium',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_opportunities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'EUR',
    "status" "OpportunityStatus" NOT NULL DEFAULT 'prospect',
    "expected_close_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_groups" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_group_members" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "original_price" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "billing_type" "BillingType" NOT NULL DEFAULT 'one_time',
    "status" "OfferStatus" NOT NULL DEFAULT 'active',
    "image_url" TEXT,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_packs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "discount_percentage" DOUBLE PRECISION,
    "status" "OfferStatus" NOT NULL DEFAULT 'active',
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_pack_items" (
    "id" TEXT NOT NULL,
    "pack_id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offer_pack_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_sends" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "offer_id" TEXT,
    "pack_id" TEXT,
    "contact_id" TEXT,
    "contact_group_id" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "OfferSendStatus" NOT NULL DEFAULT 'sent',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offer_sends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_email_tracking" (
    "id" TEXT NOT NULL,
    "offer_send_id" TEXT NOT NULL,
    "email_log_id" TEXT,
    "tracking_token" TEXT,
    "opened" BOOLEAN NOT NULL DEFAULT false,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offer_email_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_emails" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "status" "ScheduledEmailStatus" NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_email_recipients" (
    "id" TEXT NOT NULL,
    "scheduled_email_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "email" TEXT NOT NULL,
    "status" "ScheduledEmailStatus" NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMP(3),
    "email_log_id" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_email_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_sequences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger_type" "SequenceTriggerType" NOT NULL DEFAULT 'manual',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "status" "SequenceStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_sequence_steps" (
    "id" TEXT NOT NULL,
    "sequence_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "delay_days" INTEGER NOT NULL DEFAULT 0,
    "delay_hours" INTEGER NOT NULL DEFAULT 0,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" "StepChannel" NOT NULL DEFAULT 'email',
    "include_offer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_sequence_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_sequence_enrollments" (
    "id" TEXT NOT NULL,
    "sequence_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'active',
    "current_step" INTEGER NOT NULL DEFAULT 0,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "trigger_context" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_sequence_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_sequence_sends" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "step_id" TEXT NOT NULL,
    "status" "ScheduledEmailStatus" NOT NULL DEFAULT 'pending',
    "scheduled_for" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "email_log_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_sequence_sends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "to_email" TEXT NOT NULL,
    "from_email" TEXT,
    "subject" TEXT,
    "template_type" TEXT,
    "status" "EmailLogStatus" NOT NULL DEFAULT 'sent',
    "resend_id" TEXT,
    "tracking_token" TEXT,
    "metadata" JSONB,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "welcome_emails" BOOLEAN NOT NULL DEFAULT true,
    "notification_emails" BOOLEAN NOT NULL DEFAULT true,
    "marketing_emails" BOOLEAN NOT NULL DEFAULT true,
    "opportunity_emails" BOOLEAN NOT NULL DEFAULT true,
    "event_emails" BOOLEAN NOT NULL DEFAULT true,
    "digest_frequency" TEXT NOT NULL DEFAULT 'daily',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "action_url" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'medium',
    "metadata" JSONB,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "contacts_enabled" BOOLEAN NOT NULL DEFAULT true,
    "opportunities_enabled" BOOLEAN NOT NULL DEFAULT true,
    "reminders_enabled" BOOLEAN NOT NULL DEFAULT true,
    "team_activity_enabled" BOOLEAN NOT NULL DEFAULT true,
    "quiet_hours_enabled" BOOLEAN NOT NULL DEFAULT false,
    "quiet_hours_start" TEXT,
    "quiet_hours_end" TEXT,
    "email_digest" TEXT NOT NULL DEFAULT 'daily',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_objectives" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "objective_type" "ObjectiveType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_value" DOUBLE PRECISION NOT NULL,
    "current_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" "ObjectiveUnit" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "contact_status_filter" TEXT,
    "period_type" "PeriodType" NOT NULL DEFAULT 'month',
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "event_id" TEXT,
    "status" "ObjectiveStatus" NOT NULL DEFAULT 'active',
    "achieved_at" TIMESTAMP(3),
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "priority" "Priority" NOT NULL DEFAULT 'medium',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enterprises" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "industry" TEXT,
    "size" "EnterpriseSize",
    "vision" TEXT,
    "mission" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enterprises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "enterprise_id" TEXT NOT NULL,
    "parent_team_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "manager_id" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_events" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_groups" (
    "id" TEXT NOT NULL,
    "enterprise_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "icon" TEXT NOT NULL DEFAULT 'Users',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_group_members" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enterprise_objectives" (
    "id" TEXT NOT NULL,
    "enterprise_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_value" DOUBLE PRECISION,
    "current_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "status" "EnterpriseObjectiveStatus" NOT NULL DEFAULT 'not_started',
    "priority" "EnterpriseObjectivePriority" NOT NULL DEFAULT 'medium',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enterprise_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_objectives" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "enterprise_objective_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_value" DOUBLE PRECISION,
    "current_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "status" "EnterpriseObjectiveStatus" NOT NULL DEFAULT 'not_started',
    "priority" "EnterpriseObjectivePriority" NOT NULL DEFAULT 'medium',
    "assigned_to" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_objectives" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "enterprise_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_value" DOUBLE PRECISION,
    "current_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "status" "EnterpriseObjectiveStatus" NOT NULL DEFAULT 'not_started',
    "priority" "EnterpriseObjectivePriority" NOT NULL DEFAULT 'medium',
    "linked_objective_type" TEXT,
    "linked_objective_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE INDEX "contacts_user_id_idx" ON "contacts"("user_id");

-- CreateIndex
CREATE INDEX "contacts_status_idx" ON "contacts"("status");

-- CreateIndex
CREATE INDEX "contacts_user_id_status_idx" ON "contacts"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "events_qr_code_token_key" ON "events"("qr_code_token");

-- CreateIndex
CREATE INDEX "events_user_id_idx" ON "events"("user_id");

-- CreateIndex
CREATE INDEX "events_qr_code_token_idx" ON "events"("qr_code_token");

-- CreateIndex
CREATE INDEX "contact_events_event_id_idx" ON "contact_events"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "contact_events_contact_id_event_id_key" ON "contact_events"("contact_id", "event_id");

-- CreateIndex
CREATE INDEX "event_objectives_event_id_idx" ON "event_objectives"("event_id");

-- CreateIndex
CREATE INDEX "contact_notes_contact_id_idx" ON "contact_notes"("contact_id");

-- CreateIndex
CREATE INDEX "contact_activities_contact_id_idx" ON "contact_activities"("contact_id");

-- CreateIndex
CREATE INDEX "contact_relationships_contact_id_idx" ON "contact_relationships"("contact_id");

-- CreateIndex
CREATE INDEX "contact_relationships_related_contact_id_idx" ON "contact_relationships"("related_contact_id");

-- CreateIndex
CREATE UNIQUE INDEX "contact_relationships_contact_id_related_contact_id_user_id_key" ON "contact_relationships"("contact_id", "related_contact_id", "user_id");

-- CreateIndex
CREATE INDEX "interactions_contact_id_idx" ON "interactions"("contact_id");

-- CreateIndex
CREATE INDEX "interactions_user_id_idx" ON "interactions"("user_id");

-- CreateIndex
CREATE INDEX "follow_ups_contact_id_idx" ON "follow_ups"("contact_id");

-- CreateIndex
CREATE INDEX "follow_ups_user_id_idx" ON "follow_ups"("user_id");

-- CreateIndex
CREATE INDEX "follow_ups_user_id_completed_idx" ON "follow_ups"("user_id", "completed");

-- CreateIndex
CREATE INDEX "contact_opportunities_user_id_idx" ON "contact_opportunities"("user_id");

-- CreateIndex
CREATE INDEX "contact_opportunities_contact_id_idx" ON "contact_opportunities"("contact_id");

-- CreateIndex
CREATE INDEX "contact_opportunities_status_idx" ON "contact_opportunities"("status");

-- CreateIndex
CREATE INDEX "contact_groups_user_id_idx" ON "contact_groups"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "contact_group_members_group_id_contact_id_key" ON "contact_group_members"("group_id", "contact_id");

-- CreateIndex
CREATE INDEX "offers_user_id_idx" ON "offers"("user_id");

-- CreateIndex
CREATE INDEX "offer_packs_user_id_idx" ON "offer_packs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "offer_pack_items_pack_id_offer_id_key" ON "offer_pack_items"("pack_id", "offer_id");

-- CreateIndex
CREATE INDEX "offer_sends_user_id_idx" ON "offer_sends"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "offer_email_tracking_tracking_token_key" ON "offer_email_tracking"("tracking_token");

-- CreateIndex
CREATE INDEX "scheduled_emails_user_id_idx" ON "scheduled_emails"("user_id");

-- CreateIndex
CREATE INDEX "scheduled_emails_status_scheduled_for_idx" ON "scheduled_emails"("status", "scheduled_for");

-- CreateIndex
CREATE INDEX "scheduled_email_recipients_scheduled_email_id_idx" ON "scheduled_email_recipients"("scheduled_email_id");

-- CreateIndex
CREATE INDEX "email_sequences_user_id_idx" ON "email_sequences"("user_id");

-- CreateIndex
CREATE INDEX "email_sequence_steps_sequence_id_idx" ON "email_sequence_steps"("sequence_id");

-- CreateIndex
CREATE INDEX "email_sequence_enrollments_sequence_id_idx" ON "email_sequence_enrollments"("sequence_id");

-- CreateIndex
CREATE INDEX "email_sequence_enrollments_contact_id_idx" ON "email_sequence_enrollments"("contact_id");

-- CreateIndex
CREATE INDEX "email_sequence_sends_enrollment_id_idx" ON "email_sequence_sends"("enrollment_id");

-- CreateIndex
CREATE INDEX "email_sequence_sends_status_scheduled_for_idx" ON "email_sequence_sends"("status", "scheduled_for");

-- CreateIndex
CREATE UNIQUE INDEX "email_logs_tracking_token_key" ON "email_logs"("tracking_token");

-- CreateIndex
CREATE INDEX "email_logs_user_id_idx" ON "email_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_preferences_user_id_key" ON "email_preferences"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "personal_objectives_user_id_idx" ON "personal_objectives"("user_id");

-- CreateIndex
CREATE INDEX "personal_objectives_user_id_status_idx" ON "personal_objectives"("user_id", "status");

-- CreateIndex
CREATE INDEX "enterprises_owner_id_idx" ON "enterprises"("owner_id");

-- CreateIndex
CREATE INDEX "teams_enterprise_id_idx" ON "teams"("enterprise_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_team_id_contact_id_key" ON "team_members"("team_id", "contact_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_events_team_id_event_id_key" ON "team_events"("team_id", "event_id");

-- CreateIndex
CREATE INDEX "custom_groups_enterprise_id_idx" ON "custom_groups"("enterprise_id");

-- CreateIndex
CREATE UNIQUE INDEX "custom_group_members_group_id_contact_id_key" ON "custom_group_members"("group_id", "contact_id");

-- CreateIndex
CREATE INDEX "enterprise_objectives_enterprise_id_idx" ON "enterprise_objectives"("enterprise_id");

-- CreateIndex
CREATE INDEX "team_objectives_team_id_idx" ON "team_objectives"("team_id");

-- CreateIndex
CREATE INDEX "member_objectives_member_id_idx" ON "member_objectives"("member_id");

-- CreateIndex
CREATE INDEX "member_objectives_enterprise_id_idx" ON "member_objectives"("enterprise_id");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_events" ADD CONSTRAINT "contact_events_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_events" ADD CONSTRAINT "contact_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_objectives" ADD CONSTRAINT "event_objectives_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_notes" ADD CONSTRAINT "contact_notes_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_notes" ADD CONSTRAINT "contact_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_activities" ADD CONSTRAINT "contact_activities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_activities" ADD CONSTRAINT "contact_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_relationships" ADD CONSTRAINT "contact_relationships_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_relationships" ADD CONSTRAINT "contact_relationships_related_contact_id_fkey" FOREIGN KEY ("related_contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_relationships" ADD CONSTRAINT "contact_relationships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_opportunities" ADD CONSTRAINT "contact_opportunities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_opportunities" ADD CONSTRAINT "contact_opportunities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_groups" ADD CONSTRAINT "contact_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_group_members" ADD CONSTRAINT "contact_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "contact_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_group_members" ADD CONSTRAINT "contact_group_members_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_packs" ADD CONSTRAINT "offer_packs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_pack_items" ADD CONSTRAINT "offer_pack_items_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "offer_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_pack_items" ADD CONSTRAINT "offer_pack_items_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_sends" ADD CONSTRAINT "offer_sends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_sends" ADD CONSTRAINT "offer_sends_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_sends" ADD CONSTRAINT "offer_sends_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "offer_packs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_sends" ADD CONSTRAINT "offer_sends_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_sends" ADD CONSTRAINT "offer_sends_contact_group_id_fkey" FOREIGN KEY ("contact_group_id") REFERENCES "contact_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_email_tracking" ADD CONSTRAINT "offer_email_tracking_offer_send_id_fkey" FOREIGN KEY ("offer_send_id") REFERENCES "offer_sends"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_email_tracking" ADD CONSTRAINT "offer_email_tracking_email_log_id_fkey" FOREIGN KEY ("email_log_id") REFERENCES "email_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_emails" ADD CONSTRAINT "scheduled_emails_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_email_recipients" ADD CONSTRAINT "scheduled_email_recipients_scheduled_email_id_fkey" FOREIGN KEY ("scheduled_email_id") REFERENCES "scheduled_emails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_email_recipients" ADD CONSTRAINT "scheduled_email_recipients_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_email_recipients" ADD CONSTRAINT "scheduled_email_recipients_email_log_id_fkey" FOREIGN KEY ("email_log_id") REFERENCES "email_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_sequences" ADD CONSTRAINT "email_sequences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_sequence_steps" ADD CONSTRAINT "email_sequence_steps_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "email_sequences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_sequence_steps" ADD CONSTRAINT "email_sequence_steps_include_offer_id_fkey" FOREIGN KEY ("include_offer_id") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_sequence_enrollments" ADD CONSTRAINT "email_sequence_enrollments_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "email_sequences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_sequence_enrollments" ADD CONSTRAINT "email_sequence_enrollments_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_sequence_enrollments" ADD CONSTRAINT "email_sequence_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_sequence_sends" ADD CONSTRAINT "email_sequence_sends_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "email_sequence_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_sequence_sends" ADD CONSTRAINT "email_sequence_sends_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "email_sequence_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_sequence_sends" ADD CONSTRAINT "email_sequence_sends_email_log_id_fkey" FOREIGN KEY ("email_log_id") REFERENCES "email_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_preferences" ADD CONSTRAINT "email_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_objectives" ADD CONSTRAINT "personal_objectives_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_objectives" ADD CONSTRAINT "personal_objectives_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enterprises" ADD CONSTRAINT "enterprises_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_enterprise_id_fkey" FOREIGN KEY ("enterprise_id") REFERENCES "enterprises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_parent_team_id_fkey" FOREIGN KEY ("parent_team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_events" ADD CONSTRAINT "team_events_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_events" ADD CONSTRAINT "team_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_groups" ADD CONSTRAINT "custom_groups_enterprise_id_fkey" FOREIGN KEY ("enterprise_id") REFERENCES "enterprises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_group_members" ADD CONSTRAINT "custom_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "custom_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_group_members" ADD CONSTRAINT "custom_group_members_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enterprise_objectives" ADD CONSTRAINT "enterprise_objectives_enterprise_id_fkey" FOREIGN KEY ("enterprise_id") REFERENCES "enterprises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_objectives" ADD CONSTRAINT "team_objectives_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_objectives" ADD CONSTRAINT "team_objectives_enterprise_objective_id_fkey" FOREIGN KEY ("enterprise_objective_id") REFERENCES "enterprise_objectives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

