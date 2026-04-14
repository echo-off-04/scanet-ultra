/*
  # Add Missing Foreign Key Indexes

  ## Overview
  Adds indexes on all foreign key columns that were missing covering indexes.
  This improves JOIN and DELETE performance on referenced tables.

  ## Tables Affected
  1. contact_activities - user_id
  2. contact_events - created_by, event_id
  3. contact_group_members - contact_id
  4. contact_relationships - related_contact_id, user_id
  5. custom_group_members - contact_id
  6. custom_groups - created_by, enterprise_id
  7. email_logs - user_id
  8. email_sequence_enrollments - user_id
  9. email_sequence_sends - email_log_id, step_id
  10. enterprise_objectives - assigned_to, created_by, enterprise_id, event_id
  11. enterprises - owner_id
  12. event_objectives - event_id
  13. event_participants - contact_id, event_id
  14. follow_ups - contact_id, user_id
  15. interactions - contact_id, user_id
  16. member_objectives - created_by, enterprise_id, member_id
  17. offer_pack_items - offer_id
  18. offer_sends - email_log_id, offer_id, pack_id, user_id
  19. scheduled_email_recipients - contact_id
  20. team_events - event_id
  21. team_members - contact_id, user_id
  22. team_objectives - assigned_to, created_by, enterprise_objective_id, event_id, team_id
  23. teams - enterprise_id, manager_id, parent_team_id
*/

CREATE INDEX IF NOT EXISTS idx_contact_activities_user_id ON contact_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_events_created_by ON contact_events(created_by);
CREATE INDEX IF NOT EXISTS idx_contact_events_event_id ON contact_events(event_id);
CREATE INDEX IF NOT EXISTS idx_contact_group_members_contact_id ON contact_group_members(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_relationships_related_contact_id ON contact_relationships(related_contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_relationships_user_id ON contact_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_group_members_contact_id ON custom_group_members(contact_id);
CREATE INDEX IF NOT EXISTS idx_custom_groups_created_by ON custom_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_groups_enterprise_id ON custom_groups(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_sequence_enrollments_user_id ON email_sequence_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_email_sequence_sends_email_log_id ON email_sequence_sends(email_log_id);
CREATE INDEX IF NOT EXISTS idx_email_sequence_sends_step_id ON email_sequence_sends(step_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_objectives_assigned_to ON enterprise_objectives(assigned_to);
CREATE INDEX IF NOT EXISTS idx_enterprise_objectives_created_by ON enterprise_objectives(created_by);
CREATE INDEX IF NOT EXISTS idx_enterprise_objectives_enterprise_id ON enterprise_objectives(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_objectives_event_id ON enterprise_objectives(event_id);
CREATE INDEX IF NOT EXISTS idx_enterprises_owner_id ON enterprises(owner_id);
CREATE INDEX IF NOT EXISTS idx_event_objectives_event_id ON event_objectives(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_contact_id ON event_participants(contact_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_contact_id ON follow_ups(contact_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_user_id ON follow_ups(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_contact_id ON interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_member_objectives_created_by ON member_objectives(created_by);
CREATE INDEX IF NOT EXISTS idx_member_objectives_enterprise_id ON member_objectives(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_member_objectives_member_id ON member_objectives(member_id);
CREATE INDEX IF NOT EXISTS idx_offer_pack_items_offer_id ON offer_pack_items(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_sends_email_log_id ON offer_sends(email_log_id);
CREATE INDEX IF NOT EXISTS idx_offer_sends_offer_id ON offer_sends(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_sends_pack_id ON offer_sends(pack_id);
CREATE INDEX IF NOT EXISTS idx_offer_sends_user_id ON offer_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_email_recipients_contact_id ON scheduled_email_recipients(contact_id);
CREATE INDEX IF NOT EXISTS idx_team_events_event_id ON team_events(event_id);
CREATE INDEX IF NOT EXISTS idx_team_members_contact_id ON team_members(contact_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_objectives_assigned_to ON team_objectives(assigned_to);
CREATE INDEX IF NOT EXISTS idx_team_objectives_created_by ON team_objectives(created_by);
CREATE INDEX IF NOT EXISTS idx_team_objectives_enterprise_objective_id ON team_objectives(enterprise_objective_id);
CREATE INDEX IF NOT EXISTS idx_team_objectives_event_id ON team_objectives(event_id);
CREATE INDEX IF NOT EXISTS idx_team_objectives_team_id ON team_objectives(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_enterprise_id ON teams(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_teams_manager_id ON teams(manager_id);
CREATE INDEX IF NOT EXISTS idx_teams_parent_team_id ON teams(parent_team_id);
