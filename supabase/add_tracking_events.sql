-- Create tracking_events table to capture analytics data
CREATE TABLE IF NOT EXISTS tracking_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  page_path TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for performance on analytics queries
CREATE INDEX IF NOT EXISTS idx_tracking_events_name ON tracking_events(event_name);
CREATE INDEX IF NOT EXISTS idx_tracking_events_session ON tracking_events(session_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created ON tracking_events(created_at);

-- Enable RLS
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;

-- Enable insert access for everyone
CREATE POLICY "Enable insert access for all users" ON tracking_events FOR INSERT WITH CHECK (true);

-- Enable read access for everyone (since SkinWise does not have authenticated admin accounts yet)
CREATE POLICY "Enable read access for all users" ON tracking_events FOR SELECT USING (true);
