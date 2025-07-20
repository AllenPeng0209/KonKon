-- Create family_albums table for smart album functionality
CREATE TABLE family_albums (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  theme text NOT NULL DEFAULT '日常生活',
  story text,
  image_urls text[] DEFAULT '{}',
  cover_image_url text,
  photo_count integer DEFAULT 0,
  is_smart_generated boolean DEFAULT true,
  tags text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on family_albums
ALTER TABLE family_albums ENABLE ROW LEVEL SECURITY;

-- RLS policies for family_albums
CREATE POLICY "Users can view family albums" ON family_albums FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_family_relations 
      WHERE user_id = auth.uid() 
      AND family_id = family_albums.family_id
    )
  );

CREATE POLICY "Users can create family albums" ON family_albums FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_family_relations 
      WHERE user_id = auth.uid() 
      AND family_id = family_albums.family_id
    )
  );

CREATE POLICY "Users can update their own albums" ON family_albums FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own albums" ON family_albums FOR DELETE
  USING (user_id = auth.uid());

-- Create album_photos table for individual photo records within albums
CREATE TABLE album_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id uuid NOT NULL REFERENCES family_albums(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  order_index integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on album_photos
ALTER TABLE album_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for album_photos
CREATE POLICY "Users can view album photos" ON album_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_albums fa
      JOIN user_family_relations ufr ON fa.family_id = ufr.family_id
      WHERE fa.id = album_photos.album_id 
      AND ufr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert album photos" ON album_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_albums fa
      JOIN user_family_relations ufr ON fa.family_id = ufr.family_id
      WHERE fa.id = album_photos.album_id 
      AND ufr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update album photos" ON album_photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM family_albums fa
      WHERE fa.id = album_photos.album_id 
      AND fa.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete album photos" ON album_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM family_albums fa
      WHERE fa.id = album_photos.album_id 
      AND fa.user_id = auth.uid()
    )
  );

-- Create album_likes table for album interaction
CREATE TABLE album_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id uuid NOT NULL REFERENCES family_albums(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(album_id, user_id)
);

-- Enable RLS on album_likes
ALTER TABLE album_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for album_likes
CREATE POLICY "Users can view album likes" ON album_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_albums fa
      JOIN user_family_relations ufr ON fa.family_id = ufr.family_id
      WHERE fa.id = album_likes.album_id 
      AND ufr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own album likes" ON album_likes
  FOR ALL USING (user_id = auth.uid());

-- Create album_comments table for album discussions
CREATE TABLE album_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id uuid NOT NULL REFERENCES family_albums(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on album_comments
ALTER TABLE album_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for album_comments
CREATE POLICY "Users can view album comments" ON album_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_albums fa
      JOIN user_family_relations ufr ON fa.family_id = ufr.family_id
      WHERE fa.id = album_comments.album_id 
      AND ufr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create album comments" ON album_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM family_albums fa
      JOIN user_family_relations ufr ON fa.family_id = ufr.family_id
      WHERE fa.id = album_comments.album_id 
      AND ufr.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own comments" ON album_comments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON album_comments FOR DELETE
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_family_albums_family_id ON family_albums(family_id);
CREATE INDEX idx_family_albums_user_id ON family_albums(user_id);
CREATE INDEX idx_family_albums_created_at ON family_albums(created_at DESC);
CREATE INDEX idx_family_albums_theme ON family_albums(theme);

CREATE INDEX idx_album_photos_album_id ON album_photos(album_id);
CREATE INDEX idx_album_photos_order_index ON album_photos(album_id, order_index);

CREATE INDEX idx_album_likes_album_id ON album_likes(album_id);
CREATE INDEX idx_album_likes_user_id ON album_likes(user_id);

CREATE INDEX idx_album_comments_album_id ON album_comments(album_id);
CREATE INDEX idx_album_comments_user_id ON album_comments(user_id);

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_family_albums_updated_at
    BEFORE UPDATE ON family_albums
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_album_comments_updated_at
    BEFORE UPDATE ON album_comments
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Function to update photo count when album photos are added/removed
CREATE OR REPLACE FUNCTION update_album_photo_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE family_albums 
        SET photo_count = photo_count + 1 
        WHERE id = NEW.album_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE family_albums 
        SET photo_count = photo_count - 1 
        WHERE id = OLD.album_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers for photo count updates
CREATE TRIGGER update_album_photo_count_insert
    AFTER INSERT ON album_photos
    FOR EACH ROW
    EXECUTE PROCEDURE update_album_photo_count();

CREATE TRIGGER update_album_photo_count_delete
    AFTER DELETE ON album_photos
    FOR EACH ROW
    EXECUTE PROCEDURE update_album_photo_count();