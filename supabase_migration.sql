-- RUN ONCE in Supabase SQL Editor. Backup your database first.
-- This migration preserves existing rsvps and wishes records.
ALTER TABLE public.rsvps ADD COLUMN IF NOT EXISTS phone text;
-- Existing attendance constraint may have a different name. This block removes
-- CHECK constraints that reference attendance so values 0,1,2,3 can be accepted.
DO $$ DECLARE c record; BEGIN
 FOR c IN SELECT conname FROM pg_constraint
 WHERE conrelid='public.rsvps'::regclass AND contype='c'
 AND pg_get_constraintdef(oid) ILIKE '%attendance%'
 LOOP EXECUTE format('ALTER TABLE public.rsvps DROP CONSTRAINT %I',c.conname); END LOOP;
END $$;
ALTER TABLE public.rsvps ADD CONSTRAINT rsvps_attendance_0_to_3 CHECK (attendance BETWEEN 0 AND 3);
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;
-- RLS: anonymous signed-in users have the authenticated role.
DROP POLICY IF EXISTS "wedding_rsvps_select_own" ON public.rsvps;
DROP POLICY IF EXISTS "wedding_rsvps_insert_own" ON public.rsvps;
DROP POLICY IF EXISTS "wedding_rsvps_update_own" ON public.rsvps;
DROP POLICY IF EXISTS "wedding_rsvps_delete_own" ON public.rsvps;
CREATE POLICY "wedding_rsvps_select_own" ON public.rsvps FOR SELECT TO authenticated USING (user_id = (select auth.uid()));
CREATE POLICY "wedding_rsvps_insert_own" ON public.rsvps FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "wedding_rsvps_update_own" ON public.rsvps FOR UPDATE TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "wedding_rsvps_delete_own" ON public.rsvps FOR DELETE TO authenticated USING (user_id = (select auth.uid()));
DROP POLICY IF EXISTS "wedding_wishes_select_public" ON public.wishes;
DROP POLICY IF EXISTS "wedding_wishes_insert_own" ON public.wishes;
DROP POLICY IF EXISTS "wedding_wishes_update_own" ON public.wishes;
DROP POLICY IF EXISTS "wedding_wishes_delete_own" ON public.wishes;
CREATE POLICY "wedding_wishes_select_public" ON public.wishes FOR SELECT TO authenticated USING (true);
CREATE POLICY "wedding_wishes_insert_own" ON public.wishes FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "wedding_wishes_update_own" ON public.wishes FOR UPDATE TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "wedding_wishes_delete_own" ON public.wishes FOR DELETE TO authenticated USING (user_id = (select auth.uid()));
-- IMPORTANT: Review any older policies already on these tables. Permissive
-- policies are OR'ed together; remove overly broad policies before going live.
