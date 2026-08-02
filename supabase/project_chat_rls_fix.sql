-- Fix: project workspace chat messages don't send / conversation never loads
-- because `conversations` and `messages` either have RLS enabled with no
-- policies covering project chats, or no policies at all. Without a SELECT
-- policy on `conversations`, loadConversation() in project-chat.tsx silently
-- gets zero rows, conversationId stays null, and the chat input/button stay
-- disabled forever (looks like "messages aren't sending").
--
-- These policies are scoped to members of the project's team (via
-- team_members), matching how project-chat.tsx creates project conversations
-- (conversation_type = 'project', team_id = project's team).
--
-- Additive/idempotent: uses IF NOT EXISTS via DO blocks, and these are
-- permissive policies that OR with any existing policies for direct/team
-- conversations. They won't restrict access that's already granted.

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'Team members can view project conversations'
  ) THEN
    CREATE POLICY "Team members can view project conversations"
      ON conversations FOR SELECT
      TO authenticated
      USING (
        conversation_type = 'project'
        AND EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = conversations.team_id
            AND tm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'Team members can create project conversations'
  ) THEN
    CREATE POLICY "Team members can create project conversations"
      ON conversations FOR INSERT
      TO authenticated
      WITH CHECK (
        conversation_type = 'project'
        AND EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = conversations.team_id
            AND tm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'Team members can view project messages'
  ) THEN
    CREATE POLICY "Team members can view project messages"
      ON messages FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM conversations c
          JOIN team_members tm ON tm.team_id = c.team_id
          WHERE c.id = messages.conversation_id
            AND c.conversation_type = 'project'
            AND tm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'messages' AND policyname = 'Team members can send project messages'
  ) THEN
    CREATE POLICY "Team members can send project messages"
      ON messages FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
          SELECT 1 FROM conversations c
          JOIN team_members tm ON tm.team_id = c.team_id
          WHERE c.id = messages.conversation_id
            AND c.conversation_type = 'project'
            AND tm.user_id = auth.uid()
        )
      );
  END IF;
END $$;
