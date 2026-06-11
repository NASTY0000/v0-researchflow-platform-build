-- Create the project-files storage bucket used by components/projects/project-files.tsx
-- (uploadFile() uploads to the 'project-files' bucket and calls getPublicUrl()).
-- Without this bucket existing, .storage.from('project-files').upload(...) fails
-- with a "Bucket not found" error on every upload.
--
-- Path convention: `${projectId}/${timestamp}-${filename}`, so
-- (storage.foldername(name))[1] is the project id, used to scope writes to
-- members of that project's team.

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Team members can upload project files'
  ) THEN
    CREATE POLICY "Team members can upload project files"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'project-files'
        AND EXISTS (
          SELECT 1 FROM projects p
          JOIN team_members tm ON tm.team_id = p.team_id
          WHERE p.id::text = (storage.foldername(name))[1]
            AND tm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Team members can delete project files'
  ) THEN
    CREATE POLICY "Team members can delete project files"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'project-files'
        AND EXISTS (
          SELECT 1 FROM projects p
          JOIN team_members tm ON tm.team_id = p.team_id
          WHERE p.id::text = (storage.foldername(name))[1]
            AND tm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Project files are publicly readable'
  ) THEN
    CREATE POLICY "Project files are publicly readable"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'project-files');
  END IF;
END $$;
