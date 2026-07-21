-- Add class-total metric settings
-- class_total_included: whether this student's practice days count toward the site-wide total
-- class_total_visible: whether this student can see the site-wide total on their leaderboard
ALTER TABLE students
ADD COLUMN IF NOT EXISTS class_total_included BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS class_total_visible BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster included-student queries
CREATE INDEX IF NOT EXISTS idx_students_class_total_included ON students(class_total_included)
WHERE class_total_included = true;

-- Singleton table holding the current class-wide practice milestone/goal
CREATE TABLE IF NOT EXISTS class_practice_milestone (
    id INTEGER PRIMARY KEY DEFAULT 1,
    milestone INTEGER NOT NULL DEFAULT 500,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT class_practice_milestone_single_row CHECK (id = 1)
);

INSERT INTO class_practice_milestone (id, milestone)
VALUES (1, 500) ON CONFLICT (id) DO NOTHING;

ALTER TABLE class_practice_milestone ENABLE ROW LEVEL SECURITY;

-- Anyone can read the current milestone (public metric)
CREATE POLICY "Anyone can view milestone" ON class_practice_milestone FOR
SELECT USING (true);

-- Admin service role manages updates
CREATE POLICY "Admin can manage milestone" ON class_practice_milestone FOR ALL USING (true) WITH CHECK (true);
