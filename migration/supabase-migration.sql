-- Users profile table (extends Supabase auth)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  roles JSONB DEFAULT '[]'::jsonb,
  is_onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for user_profiles
CREATE POLICY "Users can view all profiles" 
  ON user_profiles FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile" 
  ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
  ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Channels table
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  members JSONB DEFAULT '[]'::jsonb,
  admins JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Create policies for channels
CREATE POLICY "Users can view channels they are members of" 
  ON channels FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    auth.uid()::text IN (SELECT jsonb_array_elements_text(members))
  );

CREATE POLICY "Users can create channels" 
  ON channels FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update channels they are members of" 
  ON channels FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    auth.uid()::text IN (SELECT jsonb_array_elements_text(members))
  );

CREATE POLICY "Users can delete channels they created or admin" 
  ON channels FOR DELETE USING (
    auth.uid() IS NOT NULL AND 
    (auth.uid() = created_by OR auth.uid()::text IN (SELECT jsonb_array_elements_text(admins)))
  );

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view messages in channels they are members of" 
  ON messages FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM channels 
      WHERE channels.id = messages.channel_id 
      AND auth.uid()::text IN (SELECT jsonb_array_elements_text(channels.members))
    )
  );

CREATE POLICY "Users can insert messages in channels they are members of" 
  ON messages FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM channels 
      WHERE channels.id = messages.channel_id 
      AND auth.uid()::text IN (SELECT jsonb_array_elements_text(channels.members))
    )
  );

-- Replies table
CREATE TABLE replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;

-- Create policies for replies
CREATE POLICY "Users can view replies in channels they are members of" 
  ON replies FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM messages 
      JOIN channels ON messages.channel_id = channels.id
      WHERE messages.id = replies.message_id 
      AND auth.uid()::text IN (SELECT jsonb_array_elements_text(channels.members))
    )
  );

CREATE POLICY "Users can insert replies in channels they are members of" 
  ON replies FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM messages 
      JOIN channels ON messages.channel_id = channels.id
      WHERE messages.id = replies.message_id 
      AND auth.uid()::text IN (SELECT jsonb_array_elements_text(channels.members))
    )
  );

-- Reactions table
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  reaction_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Create policies for reactions
CREATE POLICY "Users can view reactions" 
  ON reactions FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert reactions" 
  ON reactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete their reactions" 
  ON reactions FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  assigned_to JSONB DEFAULT '[]'::jsonb,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Users can view tasks in channels they are members of" 
  ON tasks FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM channels 
      WHERE channels.id = tasks.channel_id 
      AND auth.uid()::text IN (SELECT jsonb_array_elements_text(channels.members))
    )
  );

CREATE POLICY "Users can modify tasks in channels they are members of" 
  ON tasks FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM channels 
      WHERE channels.id = tasks.channel_id 
      AND auth.uid()::text IN (SELECT jsonb_array_elements_text(channels.members))
    )
  );

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT,
  is_read BOOLEAN DEFAULT false,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
  ON notifications FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can modify their own notifications" 
  ON notifications FOR ALL USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Student Management System Tables
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  location TEXT,
  city TEXT,
  funnel_step TEXT,
  interest TEXT,
  platform TEXT,
  courses JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  avatar TEXT,
  avatar_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create policies for students
CREATE POLICY "Users can view all students" 
  ON students FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can modify students" 
  ON students FOR ALL USING (auth.uid() IS NOT NULL);

-- Option tables for Student Management
CREATE TABLE funnel_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  value TEXT NOT NULL
);

CREATE TABLE course_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  value TEXT NOT NULL
);

CREATE TABLE platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  value TEXT NOT NULL
);

CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  value TEXT NOT NULL
);

CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  value TEXT NOT NULL,
  country_id UUID REFERENCES countries(id) ON DELETE CASCADE
);

-- Enable RLS for option tables
ALTER TABLE funnel_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Create policies for option tables
CREATE POLICY "Users can view all options" 
  ON funnel_steps FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can modify options" 
  ON funnel_steps FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all options" 
  ON course_interests FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can modify options" 
  ON course_interests FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all options" 
  ON platforms FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can modify options" 
  ON platforms FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all options" 
  ON countries FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can modify options" 
  ON countries FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all options" 
  ON cities FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can modify options" 
  ON cities FOR ALL USING (auth.uid() IS NOT NULL);

-- Class management system
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  level TEXT,
  class_type TEXT,
  teachers JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  channel_id UUID REFERENCES channels(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Create policies for classes
CREATE POLICY "Users can view all classes" 
  ON classes FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can modify classes" 
  ON classes FOR ALL USING (auth.uid() IS NOT NULL);

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  level TEXT,
  course_type TEXT,
  teachers JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  class_id UUID REFERENCES classes(id),
  channel_id UUID REFERENCES channels(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create policies for courses
CREATE POLICY "Users can view all courses" 
  ON courses FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can modify courses" 
  ON courses FOR ALL USING (auth.uid() IS NOT NULL);

-- Enrollments table
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id),
  course_id UUID REFERENCES courses(id),
  class_id UUID REFERENCES classes(id),
  status TEXT DEFAULT 'active',
  payment_status TEXT DEFAULT 'pending',
  enrollment_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Create policies for enrollments
CREATE POLICY "Users can view all enrollments" 
  ON enrollments FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create enrollments" 
  ON enrollments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update enrollments they created" 
  ON enrollments FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Users can delete enrollments they created" 
  ON enrollments FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = created_by);

-- Create real-time subscription triggers
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 