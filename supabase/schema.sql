-- Origins — run once in Supabase → SQL Editor (matches ARCHITECTURE.md).
-- Safe to re-run: drops policies before recreate.

-- ─── persons ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL DEFAULT '',
  birth_year INTEGER,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS persons_user_id_idx ON public.persons (user_id);

ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "persons_select_own" ON public.persons;
DROP POLICY IF EXISTS "persons_insert_own" ON public.persons;
DROP POLICY IF EXISTS "persons_update_own" ON public.persons;
DROP POLICY IF EXISTS "persons_delete_own" ON public.persons;

CREATE POLICY "persons_select_own"
  ON public.persons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "persons_insert_own"
  ON public.persons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "persons_update_own"
  ON public.persons FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "persons_delete_own"
  ON public.persons FOR DELETE
  USING (auth.uid() = user_id);

-- ─── stories (Interview / Timeline gates) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.persons (id) ON DELETE CASCADE,
  question_text TEXT NOT NULL DEFAULT '',
  response_text TEXT NOT NULL DEFAULT '',
  audio_url TEXT,
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  estimated_date TEXT,
  theme TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stories_person_id_idx ON public.stories (person_id);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stories_select_via_person" ON public.stories;
DROP POLICY IF EXISTS "stories_insert_via_person" ON public.stories;
DROP POLICY IF EXISTS "stories_update_via_person" ON public.stories;
DROP POLICY IF EXISTS "stories_delete_via_person" ON public.stories;

CREATE POLICY "stories_select_via_person"
  ON public.stories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.persons p
      WHERE p.id = stories.person_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "stories_insert_via_person"
  ON public.stories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.persons p
      WHERE p.id = stories.person_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "stories_update_via_person"
  ON public.stories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.persons p
      WHERE p.id = stories.person_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "stories_delete_via_person"
  ON public.stories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.persons p
      WHERE p.id = stories.person_id AND p.user_id = auth.uid()
    )
  );

-- ─── Storage: audio & photos (first path segment = persons.id) ─────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-audio', 'story-audio', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('story-photos', 'story-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "story_audio_select" ON storage.objects;
DROP POLICY IF EXISTS "story_audio_insert" ON storage.objects;
DROP POLICY IF EXISTS "story_audio_update" ON storage.objects;
DROP POLICY IF EXISTS "story_audio_delete" ON storage.objects;

CREATE POLICY "story_audio_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'story-audio'
    AND EXISTS (
      SELECT 1 FROM public.persons p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "story_audio_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'story-audio'
    AND EXISTS (
      SELECT 1 FROM public.persons p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "story_audio_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'story-audio'
    AND EXISTS (
      SELECT 1 FROM public.persons p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "story_audio_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'story-audio'
    AND EXISTS (
      SELECT 1 FROM public.persons p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "story_photos_select" ON storage.objects;
DROP POLICY IF EXISTS "story_photos_insert" ON storage.objects;
DROP POLICY IF EXISTS "story_photos_update" ON storage.objects;
DROP POLICY IF EXISTS "story_photos_delete" ON storage.objects;

CREATE POLICY "story_photos_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'story-photos'
    AND EXISTS (
      SELECT 1 FROM public.persons p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "story_photos_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'story-photos'
    AND EXISTS (
      SELECT 1 FROM public.persons p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "story_photos_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'story-photos'
    AND EXISTS (
      SELECT 1 FROM public.persons p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "story_photos_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'story-photos'
    AND EXISTS (
      SELECT 1 FROM public.persons p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND p.user_id = auth.uid()
    )
  );

-- ─── Storage: profile photos (public URLs) ───────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "profile_photos_insert" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_update" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_delete" ON storage.objects;

CREATE POLICY "profile_photos_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "profile_photos_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "profile_photos_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
