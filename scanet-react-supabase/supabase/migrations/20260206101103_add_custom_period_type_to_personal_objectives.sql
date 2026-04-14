/*
  # Add custom period type and enforce date ranges

  1. Changes
    - Add 'custom' to period_type CHECK constraint on personal_objectives
    - This allows users to set fully custom date ranges for their objectives

  2. Important Notes
    - All objectives now use period_start and period_end for date filtering
    - The 'custom' period type indicates a user-defined date range
*/

ALTER TABLE personal_objectives DROP CONSTRAINT IF EXISTS personal_objectives_period_type_check;

ALTER TABLE personal_objectives ADD CONSTRAINT personal_objectives_period_type_check
  CHECK (period_type IN ('day', 'week', 'month', 'year', 'all_time', 'custom'));
