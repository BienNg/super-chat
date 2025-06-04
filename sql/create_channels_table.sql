-- This function creates the channels table if it doesn't exist
-- It should be executed as a stored procedure in your Supabase project
-- To use it, go to the SQL Editor in Supabase and run this code

CREATE OR REPLACE FUNCTION create_channels_table()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the table already exists
    IF NOT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'channels'
    ) THEN
        -- Create the channels table
        CREATE TABLE public.channels (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            name text NOT NULL,
            type text NOT NULL DEFAULT 'general',
            members text[] DEFAULT '{}'::text[],
            admins text[] DEFAULT '{}'::text[],
            created_by text,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            settings jsonb DEFAULT '{"allowMemberInvites": false, "isPrivate": false, "notifications": true}'::jsonb
        );

        -- Add RLS policies
        ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

        -- Create policy for authenticated users to select
        CREATE POLICY "Authenticated users can select channels"
        ON public.channels
        FOR SELECT
        USING (auth.role() = 'authenticated');

        -- Create policy for authenticated users to insert
        CREATE POLICY "Authenticated users can insert channels"
        ON public.channels
        FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');

        -- Create policy for authenticated users to update their own channels
        CREATE POLICY "Authenticated users can update channels they are admins of"
        ON public.channels
        FOR UPDATE
        USING (auth.uid()::text = ANY(admins));

        -- Create policy for authenticated users to delete their own channels
        CREATE POLICY "Authenticated users can delete channels they are admins of"
        ON public.channels
        FOR DELETE
        USING (auth.uid()::text = ANY(admins));

        -- Create indexes for better performance
        CREATE INDEX channels_members_idx ON public.channels USING GIN (members);
        CREATE INDEX channels_admins_idx ON public.channels USING GIN (admins);
        CREATE INDEX channels_name_idx ON public.channels (name);

        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$; 