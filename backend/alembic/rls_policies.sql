-- ====================================================================
-- SUPABASE POSTGRESQL ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- 1. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- 2. Profiles policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- 3. Documents policies
CREATE POLICY "Users can view own documents"
    ON documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
    ON documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
    ON documents FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Interviews policies
CREATE POLICY "Users can view own interviews"
    ON interviews FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interviews"
    ON interviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interviews"
    ON interviews FOR UPDATE
    USING (auth.uid() = user_id);

-- 5. Interview Plans policies
CREATE POLICY "Users can view plans for own interviews"
    ON interview_plans FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM interviews
            WHERE interviews.id = interview_plans.interview_id
              AND interviews.user_id = auth.uid()
        )
    );

-- 6. Questions & Answer Attempts policies
CREATE POLICY "Users can view questions for own interviews"
    ON questions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM interviews
            WHERE interviews.id = questions.interview_id
              AND interviews.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view answer attempts for own questions"
    ON answer_attempts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM questions
            JOIN interviews ON interviews.id = questions.interview_id
            WHERE questions.id = answer_attempts.question_id
              AND interviews.user_id = auth.uid()
        )
    );

-- 7. Reports policies
CREATE POLICY "Users can view reports for own interviews"
    ON reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM interviews
            WHERE interviews.id = reports.interview_id
              AND interviews.user_id = auth.uid()
        )
    );

-- 8. Recordings policies (Enforces private recording access)
CREATE POLICY "Users can view own recordings"
    ON recordings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recordings"
    ON recordings FOR DELETE
    USING (auth.uid() = user_id);

-- 9. Feedback policies
CREATE POLICY "Users can insert own feedback"
    ON feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
    ON feedback FOR SELECT
    USING (auth.uid() = user_id);
