/*
  # Add Missing RLS Policies (Corrected)

  1. Security Changes
    - Add RLS policies for tables that were created without proper policies
    - Ensures data isolation between users
  
  2. Tables Affected
    - offers: Users can only access their own offers
    - offer_packs: Users can only access their own offer packs
    - offer_pack_items: Users can access pack items for their own packs
    - enterprises: Users can only access their own enterprise data
    - contact_groups: Users can only access their own contact groups
    - contact_group_members: Users can access members of their own groups
    - event_objectives: Users can only access objectives for their own events
*/

-- Add policies for offers table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offers') THEN
    DROP POLICY IF EXISTS "Users can view own offers" ON offers;
    DROP POLICY IF EXISTS "Users can create own offers" ON offers;
    DROP POLICY IF EXISTS "Users can update own offers" ON offers;
    DROP POLICY IF EXISTS "Users can delete own offers" ON offers;

    CREATE POLICY "Users can view own offers"
      ON offers FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can create own offers"
      ON offers FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update own offers"
      ON offers FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can delete own offers"
      ON offers FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add policies for offer_packs table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offer_packs') THEN
    DROP POLICY IF EXISTS "Users can view own offer packs" ON offer_packs;
    DROP POLICY IF EXISTS "Users can create own offer packs" ON offer_packs;
    DROP POLICY IF EXISTS "Users can update own offer packs" ON offer_packs;
    DROP POLICY IF EXISTS "Users can delete own offer packs" ON offer_packs;

    CREATE POLICY "Users can view own offer packs"
      ON offer_packs FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can create own offer packs"
      ON offer_packs FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update own offer packs"
      ON offer_packs FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can delete own offer packs"
      ON offer_packs FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add policies for offer_pack_items table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offer_pack_items') THEN
    DROP POLICY IF EXISTS "Users can view own offer pack items" ON offer_pack_items;
    DROP POLICY IF EXISTS "Users can create own offer pack items" ON offer_pack_items;
    DROP POLICY IF EXISTS "Users can delete own offer pack items" ON offer_pack_items;

    CREATE POLICY "Users can view own offer pack items"
      ON offer_pack_items FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM offer_packs
          WHERE offer_packs.id = offer_pack_items.pack_id
          AND offer_packs.user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can create own offer pack items"
      ON offer_pack_items FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM offer_packs
          WHERE offer_packs.id = offer_pack_items.pack_id
          AND offer_packs.user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can delete own offer pack items"
      ON offer_pack_items FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM offer_packs
          WHERE offer_packs.id = offer_pack_items.pack_id
          AND offer_packs.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Add policies for enterprises table (uses owner_id not user_id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enterprises') THEN
    DROP POLICY IF EXISTS "Users can view own enterprise" ON enterprises;
    DROP POLICY IF EXISTS "Users can create own enterprise" ON enterprises;
    DROP POLICY IF EXISTS "Users can update own enterprise" ON enterprises;
    DROP POLICY IF EXISTS "Users can delete own enterprise" ON enterprises;

    CREATE POLICY "Users can view own enterprise"
      ON enterprises FOR SELECT
      TO authenticated
      USING (auth.uid() = owner_id);

    CREATE POLICY "Users can create own enterprise"
      ON enterprises FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = owner_id);

    CREATE POLICY "Users can update own enterprise"
      ON enterprises FOR UPDATE
      TO authenticated
      USING (auth.uid() = owner_id)
      WITH CHECK (auth.uid() = owner_id);

    CREATE POLICY "Users can delete own enterprise"
      ON enterprises FOR DELETE
      TO authenticated
      USING (auth.uid() = owner_id);
  END IF;
END $$;

-- Add policies for contact_groups table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_groups') THEN
    DROP POLICY IF EXISTS "Users can view own contact groups" ON contact_groups;
    DROP POLICY IF EXISTS "Users can create own contact groups" ON contact_groups;
    DROP POLICY IF EXISTS "Users can update own contact groups" ON contact_groups;
    DROP POLICY IF EXISTS "Users can delete own contact groups" ON contact_groups;

    CREATE POLICY "Users can view own contact groups"
      ON contact_groups FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can create own contact groups"
      ON contact_groups FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update own contact groups"
      ON contact_groups FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can delete own contact groups"
      ON contact_groups FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add policies for contact_group_members table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_group_members') THEN
    DROP POLICY IF EXISTS "Users can view own contact group members" ON contact_group_members;
    DROP POLICY IF EXISTS "Users can create own contact group members" ON contact_group_members;
    DROP POLICY IF EXISTS "Users can delete own contact group members" ON contact_group_members;

    CREATE POLICY "Users can view own contact group members"
      ON contact_group_members FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM contact_groups
          WHERE contact_groups.id = contact_group_members.group_id
          AND contact_groups.user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can create own contact group members"
      ON contact_group_members FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM contact_groups
          WHERE contact_groups.id = contact_group_members.group_id
          AND contact_groups.user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can delete own contact group members"
      ON contact_group_members FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM contact_groups
          WHERE contact_groups.id = contact_group_members.group_id
          AND contact_groups.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Add policies for event_objectives table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_objectives') THEN
    DROP POLICY IF EXISTS "Users can view own event objectives" ON event_objectives;
    DROP POLICY IF EXISTS "Users can create own event objectives" ON event_objectives;
    DROP POLICY IF EXISTS "Users can update own event objectives" ON event_objectives;
    DROP POLICY IF EXISTS "Users can delete own event objectives" ON event_objectives;

    CREATE POLICY "Users can view own event objectives"
      ON event_objectives FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM events
          WHERE events.id = event_objectives.event_id
          AND events.user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can create own event objectives"
      ON event_objectives FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM events
          WHERE events.id = event_objectives.event_id
          AND events.user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can update own event objectives"
      ON event_objectives FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM events
          WHERE events.id = event_objectives.event_id
          AND events.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM events
          WHERE events.id = event_objectives.event_id
          AND events.user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can delete own event objectives"
      ON event_objectives FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM events
          WHERE events.id = event_objectives.event_id
          AND events.user_id = auth.uid()
        )
      );
  END IF;
END $$;