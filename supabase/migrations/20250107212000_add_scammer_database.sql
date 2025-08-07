-- Scammer database table
CREATE TABLE IF NOT EXISTS scammer_database (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('username', 'email', 'phone', 'wallet', 'url')),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  source TEXT NOT NULL,
  description TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for scammer_database
CREATE INDEX IF NOT EXISTS scammer_database_identifier_idx ON scammer_database(identifier);
CREATE INDEX IF NOT EXISTS scammer_database_type_idx ON scammer_database(identifier_type);
CREATE INDEX IF NOT EXISTS scammer_database_confidence_idx ON scammer_database(confidence);
CREATE INDEX IF NOT EXISTS scammer_database_source_idx ON scammer_database(source);
CREATE INDEX IF NOT EXISTS scammer_database_status_idx ON scammer_database(status);
CREATE INDEX IF NOT EXISTS scammer_database_tags_idx ON scammer_database USING GIN(tags);
CREATE INDEX IF NOT EXISTS scammer_database_created_at_idx ON scammer_database(created_at);

-- Unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS scammer_database_unique_identifier 
ON scammer_database(LOWER(identifier), identifier_type) 
WHERE status = 'active';

-- Add role column to profiles table for admin permissions
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_scammer_database_updated_at 
    BEFORE UPDATE ON scammer_database 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE scammer_database ENABLE ROW LEVEL SECURITY;

-- Admins can manage all entries
CREATE POLICY "Admins can manage scammer database" ON scammer_database 
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- All authenticated users can read active entries (for scam checking)
CREATE POLICY "Authenticated users can read active entries" ON scammer_database 
FOR SELECT USING (
  auth.role() = 'authenticated' AND status = 'active'
);

-- Functions for scammer database operations
CREATE OR REPLACE FUNCTION check_scammer_identifier(
  p_identifier TEXT,
  p_identifier_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  identifier TEXT,
  identifier_type TEXT,
  confidence INTEGER,
  source TEXT,
  description TEXT,
  tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.identifier,
    s.identifier_type,
    s.confidence,
    s.source,
    s.description,
    s.tags
  FROM scammer_database s
  WHERE s.status = 'active'
    AND (
      LOWER(s.identifier) = LOWER(p_identifier)
      OR (
        p_identifier_type IS NOT NULL 
        AND s.identifier_type = p_identifier_type
        AND LOWER(s.identifier) = LOWER(p_identifier)
      )
    )
  ORDER BY s.confidence DESC, s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to batch check multiple identifiers
CREATE OR REPLACE FUNCTION check_multiple_identifiers(
  p_identifiers TEXT[]
)
RETURNS TABLE (
  identifier TEXT,
  found_entries JSONB
) AS $$
DECLARE
  identifier_item TEXT;
  entry_data JSONB;
BEGIN
  FOREACH identifier_item IN ARRAY p_identifiers LOOP
    -- Get all matching entries for this identifier
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'identifier', s.identifier,
          'identifier_type', s.identifier_type,
          'confidence', s.confidence,
          'source', s.source,
          'description', s.description,
          'tags', s.tags
        )
      ),
      '[]'::jsonb
    ) INTO entry_data
    FROM scammer_database s
    WHERE s.status = 'active'
      AND LOWER(s.identifier) = LOWER(identifier_item);
    
    RETURN QUERY SELECT identifier_item, entry_data;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add scammer entry with duplicate checking
CREATE OR REPLACE FUNCTION add_scammer_entry(
  p_identifier TEXT,
  p_identifier_type TEXT,
  p_confidence INTEGER,
  p_source TEXT,
  p_description TEXT DEFAULT '',
  p_tags TEXT[] DEFAULT '{}',
  p_created_by UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
  entry_id UUID;
  existing_entry_id UUID;
BEGIN
  -- Check if entry already exists
  SELECT id INTO existing_entry_id
  FROM scammer_database
  WHERE LOWER(identifier) = LOWER(p_identifier)
    AND identifier_type = p_identifier_type
    AND status = 'active';
  
  IF existing_entry_id IS NOT NULL THEN
    -- Update existing entry with higher confidence or more recent data
    UPDATE scammer_database
    SET confidence = GREATEST(confidence, p_confidence),
        source = CASE 
          WHEN p_confidence > confidence THEN p_source 
          ELSE source 
        END,
        description = CASE 
          WHEN p_confidence > confidence OR description = '' THEN p_description 
          ELSE description 
        END,
        tags = array(SELECT DISTINCT unnest(tags || p_tags)),
        updated_at = NOW()
    WHERE id = existing_entry_id
    RETURNING id INTO entry_id;
  ELSE
    -- Insert new entry
    INSERT INTO scammer_database (
      identifier,
      identifier_type,
      confidence,
      source,
      description,
      tags,
      created_by
    ) VALUES (
      p_identifier,
      p_identifier_type,
      p_confidence,
      p_source,
      p_description,
      p_tags,
      p_created_by
    ) RETURNING id INTO entry_id;
  END IF;
  
  RETURN entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get scammer database statistics
CREATE OR REPLACE FUNCTION get_scammer_database_stats()
RETURNS TABLE (
  total_entries INTEGER,
  active_entries INTEGER,
  high_confidence_entries INTEGER,
  entries_by_type JSONB,
  entries_by_source JSONB,
  recent_additions INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_entries,
    COUNT(*) FILTER (WHERE status = 'active')::INTEGER as active_entries,
    COUNT(*) FILTER (WHERE status = 'active' AND confidence >= 80)::INTEGER as high_confidence_entries,
    jsonb_object_agg(identifier_type, type_count) as entries_by_type,
    jsonb_object_agg(source, source_count) as entries_by_source,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::INTEGER as recent_additions
  FROM scammer_database s
  LEFT JOIN (
    SELECT identifier_type, COUNT(*) as type_count
    FROM scammer_database
    WHERE status = 'active'
    GROUP BY identifier_type
  ) type_stats ON true
  LEFT JOIN (
    SELECT source, COUNT(*) as source_count
    FROM scammer_database
    WHERE status = 'active'
    GROUP BY source
  ) source_stats ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed some initial data (optional - remove in production)
INSERT INTO scammer_database (identifier, identifier_type, confidence, source, description, tags) VALUES
  ('@known_scammer', 'username', 95, 'FBI IC3', 'Confirmed investment scam operator', '{"telegram", "investment", "crypto"}'),
  ('scammer@fraud.com', 'email', 90, 'FTC Consumer Reports', 'Multiple pyramid scheme reports', '{"email", "pyramid", "mlm"}'),
  ('+1-555-SCAM', 'phone', 85, 'User Reports', 'Robocall investment fraud', '{"phone", "robocall", "investment"}')
ON CONFLICT DO NOTHING;