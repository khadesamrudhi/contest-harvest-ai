-- database/migrations/001_create_users.sql

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    plan VARCHAR(20) DEFAULT 'free',
    subscription_status VARCHAR(20) DEFAULT 'active',
    last_login TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access only their own data
CREATE POLICY users_policy ON users
    FOR ALL
    USING (auth.uid() = id);

-- database/migrations/002_create_competitors.sql

CREATE TABLE IF NOT EXISTS competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    website TEXT NOT NULL,
    description TEXT,
    industry VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    last_scraped TIMESTAMP WITH TIME ZONE,
    scraping_frequency VARCHAR(20) DEFAULT 'weekly',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_competitors_user_id ON competitors(user_id);
CREATE INDEX IF NOT EXISTS idx_competitors_website ON competitors(website);
CREATE INDEX IF NOT EXISTS idx_competitors_status ON competitors(status);
CREATE INDEX IF NOT EXISTS idx_competitors_last_scraped ON competitors(last_scraped);

-- Enable RLS
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY competitors_policy ON competitors
    FOR ALL
    USING (auth.uid() = user_id);

-- database/migrations/003_create_scraping_jobs.sql

CREATE TABLE IF NOT EXISTS scraping_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    priority INTEGER DEFAULT 5,
    target_url TEXT NOT NULL,
    results JSONB,
    error_message TEXT,
    progress INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_user_id ON scraping_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_competitor_id ON scraping_jobs(competitor_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_type ON scraping_jobs(type);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_priority ON scraping_jobs(priority DESC);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_created_at ON scraping_jobs(created_at);

-- Enable RLS
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY scraping_jobs_policy ON scraping_jobs
    FOR ALL
    USING (auth.uid() = user_id);

-- database/migrations/004_create_assets.sql

CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    file_path TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    description TEXT,
    tags TEXT[],
    source_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_tags ON assets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at);

-- Enable RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY assets_policy ON assets
    FOR ALL
    USING (auth.uid() = user_id);

-- database/migrations/005_create_trends.sql

CREATE TABLE IF NOT EXISTS trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    trend_score DECIMAL(10,2) DEFAULT 0,
    volume INTEGER DEFAULT 0,
    growth_rate DECIMAL(10,2) DEFAULT 0,
    source VARCHAR(50) NOT NULL,
    geographic_region VARCHAR(100),
    timeframe VARCHAR(20),
    related_queries TEXT[],
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trends_keyword ON trends(keyword);
CREATE INDEX IF NOT EXISTS idx_trends_category ON trends(category);
CREATE INDEX IF NOT EXISTS idx_trends_trend_score ON trends(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_trends_source ON trends(source);
CREATE INDEX IF NOT EXISTS idx_trends_created_at ON trends(created_at);
CREATE INDEX IF NOT EXISTS idx_trends_related_queries ON trends USING GIN(related_queries);

-- database/migrations/006_create_content.sql

CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500),
    content_type VARCHAR(50) NOT NULL,
    topic VARCHAR(255),
    target_audience VARCHAR(100),
    content_preview TEXT,
    results JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'generated',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id);
CREATE INDEX IF NOT EXISTS idx_content_type ON content(content_type);
CREATE INDEX IF NOT EXISTS idx_content_topic ON content(topic);
CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at);

-- Enable RLS
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY content_policy ON content
    FOR ALL
    USING (auth.uid() = user_id);

-- database/migrations/007_create_analyses.sql

CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
    trend_id UUID REFERENCES trends(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    content_title VARCHAR(500),
    content_type VARCHAR(50),
    content_preview TEXT,
    results JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_competitor_id ON analyses(competitor_id);
CREATE INDEX IF NOT EXISTS idx_analyses_trend_id ON analyses(trend_id);
CREATE INDEX IF NOT EXISTS idx_analyses_type ON analyses(type);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at);

-- Enable RLS
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY analyses_policy ON analyses
    FOR ALL
    USING (auth.uid() = user_id);

-- database/migrations/008_create_integrations.sql

CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    platform_id VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active',
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_platform ON integrations(platform);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);

-- Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY integrations_policy ON integrations
    FOR ALL
    USING (auth.uid() = user_id);

-- database/policies/user_policies.sql

-- Update function for users table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitors_updated_at BEFORE UPDATE ON competitors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scraping_jobs_updated_at BEFORE UPDATE ON scraping_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- database/seeds/sample_users.sql

-- Sample users (passwords are hashed versions of 'password123')
INSERT INTO users (id, name, email, password, plan) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'John Doe', 'john@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewgEgm2L2vjShk5K', 'pro'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Jane Smith', 'jane@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewgEgm2L2vjShk5K', 'free'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Bob Johnson', 'bob@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewgEgm2L2vjShk5K', 'pro')
ON CONFLICT (email) DO NOTHING;

-- database/seeds/sample_competitors.sql

INSERT INTO competitors (id, user_id, name, website, description, industry) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'TechCrunch', 'https://techcrunch.com', 'Leading technology media platform', 'technology'),
    ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Mashable', 'https://mashable.com', 'Digital media and technology news', 'technology'),
    ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Forbes', 'https://forbes.com', 'Business and finance publication', 'business'),
    ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Entrepreneur', 'https://entrepreneur.com', 'Entrepreneurship and business content', 'business')
ON CONFLICT (id) DO NOTHING;

-- database/seeds/sample_trends.sql

INSERT INTO trends (keyword, category, trend_score, volume, growth_rate, source, related_queries) VALUES
    ('artificial intelligence', 'technology', 95.5, 1000000, 15.2, 'google_trends', ARRAY['AI', 'machine learning', 'deep learning']),
    ('remote work', 'business', 87.3, 750000, 8.7, 'google_trends', ARRAY['work from home', 'digital nomad', 'virtual office']),
    ('sustainable fashion', 'fashion', 78.9, 250000, 12.4, 'twitter', ARRAY['eco fashion', 'green clothing', 'sustainable style']),
    ('cryptocurrency', 'finance', 92.1, 2000000, 5.3, 'google_trends', ARRAY['bitcoin', 'ethereum', 'blockchain']),
    ('mental health', 'health', 85.6, 500000, 9.8, 'twitter', ARRAY['wellness', 'mindfulness', 'therapy'])
ON CONFLICT DO NOTHING;