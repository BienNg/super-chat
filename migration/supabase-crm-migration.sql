-- Create the countries table
CREATE TABLE IF NOT EXISTS countries (
  id BIGSERIAL PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the cities table
CREATE TABLE IF NOT EXISTS cities (
  id BIGSERIAL PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the platforms table
CREATE TABLE IF NOT EXISTS platforms (
  id BIGSERIAL PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the categories table
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the students table
CREATE TABLE IF NOT EXISTS students (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  city TEXT,
  address TEXT,
  avatar TEXT,
  avatar_color TEXT,
  platform TEXT,
  categories TEXT[],
  emergency_contact TEXT,
  date_of_birth TIMESTAMP WITH TIME ZONE,
  gender TEXT,
  level TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  enrollment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users
);

-- Create the courses table
CREATE TABLE IF NOT EXISTS courses (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  level TEXT,
  duration INTEGER,
  price DECIMAL,
  currency TEXT DEFAULT 'VND',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users
);

-- Create the classes table
CREATE TABLE IF NOT EXISTS classes (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  course_id UUID REFERENCES courses(id),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  schedule TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users
);

-- Create the enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  
  -- Denormalized student data
  student_name TEXT,
  student_email TEXT,
  
  -- Denormalized course data
  course_name TEXT,
  course_level TEXT,
  
  -- Denormalized class data
  class_name TEXT,
  
  -- Enrollment specific data
  status TEXT DEFAULT 'active',
  progress INTEGER DEFAULT 0,
  attendance INTEGER DEFAULT 0,
  grade TEXT,
  
  -- Payment information
  amount DECIMAL DEFAULT 0,
  currency TEXT DEFAULT 'VND',
  payment_status TEXT DEFAULT 'pending',
  payment_id BIGINT,
  
  -- Dates
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  completion_date TIMESTAMP WITH TIME ZONE,
  
  -- Additional information
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users
);

-- Create the payments table
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'VND',
  payment_method TEXT,
  status TEXT DEFAULT 'pending',
  transaction_id TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users
);

-- Create the accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  currency TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the discounts table
CREATE TABLE IF NOT EXISTS discounts (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT, -- e.g., percentage, fixed
  value NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS policies for security
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Create policies that allow authenticated users to see all data
CREATE POLICY "Allow authenticated users to see all countries" ON countries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to see all cities" ON cities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to see all platforms" ON platforms
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to see all categories" ON categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to see all students" ON students
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to see all courses" ON courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to see all classes" ON classes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to see all enrollments" ON enrollments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to see all payments" ON payments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to see all accounts" ON accounts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to see all discounts" ON discounts
  FOR SELECT TO authenticated USING (true);

-- Create policies that allow authenticated users to insert data
CREATE POLICY "Allow authenticated users to insert countries" ON countries
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert cities" ON cities
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert platforms" ON platforms
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert categories" ON categories
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert students" ON students
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert courses" ON courses
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert classes" ON classes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert enrollments" ON enrollments
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert payments" ON payments
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert accounts" ON accounts
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert discounts" ON discounts
  FOR INSERT TO authenticated WITH CHECK (true);

-- Create policies that allow authenticated users to update data
CREATE POLICY "Allow authenticated users to update countries" ON countries
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update cities" ON cities
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update platforms" ON platforms
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update categories" ON categories
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update students" ON students
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update courses" ON courses
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update classes" ON classes
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update enrollments" ON enrollments
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update payments" ON payments
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update accounts" ON accounts
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update discounts" ON discounts
  FOR UPDATE TO authenticated USING (true);

-- Create policies that allow authenticated users to delete data
CREATE POLICY "Allow authenticated users to delete countries" ON countries
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete cities" ON cities
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete platforms" ON platforms
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete categories" ON categories
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete students" ON students
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete courses" ON courses
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete classes" ON classes
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete enrollments" ON enrollments
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete payments" ON payments
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete accounts" ON accounts
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete discounts" ON discounts
  FOR DELETE TO authenticated USING (true); 