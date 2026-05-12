/**
 * Production Database Schema Updates
 * 
 * Run these migrations in Supabase SQL editor or use Supabase CLI
 */

// 1. Add user_id to documents table for per-user data separation
export const migration_add_user_to_documents = `
  ALTER TABLE documents 
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN is_public boolean DEFAULT false;
  
  -- Create index for faster user queries
  CREATE INDEX idx_documents_user_id ON documents(user_id);
  
  -- Enable RLS
  ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
  
  -- Users can only see their own documents
  CREATE POLICY "Users can view their own documents" 
    ON documents FOR SELECT 
    USING (user_id = auth.uid() OR is_public = true);
  
  CREATE POLICY "Users can insert their own documents" 
    ON documents FOR INSERT 
    WITH CHECK (user_id = auth.uid());
  
  CREATE POLICY "Users can delete their own documents" 
    ON documents FOR DELETE 
    USING (user_id = auth.uid());
`;

// 2. Create chat_messages table for persistent conversation history
export const migration_create_chat_history = `
  CREATE TABLE chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id varchar(100) NOT NULL,
    role varchar(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
  );
  
  -- Index for faster lookups
  CREATE INDEX idx_chat_messages_user_session ON chat_messages(user_id, session_id);
  CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
  
  -- Enable RLS
  ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
  
  -- Users can only see their own messages
  CREATE POLICY "Users can view their own messages" 
    ON chat_messages FOR SELECT 
    USING (user_id = auth.uid());
  
  CREATE POLICY "Users can insert their own messages" 
    ON chat_messages FOR INSERT 
    WITH CHECK (user_id = auth.uid());
  
  CREATE POLICY "Users can delete their own messages" 
    ON chat_messages FOR DELETE 
    USING (user_id = auth.uid());
`;

// 3. Create audit_logs table for admin monitoring
export const migration_create_audit_logs = `
  CREATE TABLE audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action varchar(50) NOT NULL,
    resource varchar(50) NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
  );
  
  CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
  CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
`;

// 4. Update match_documents RPC to include user_id
export const migration_update_match_documents_rpc = `
  CREATE OR REPLACE FUNCTION match_documents (
    query_embedding vector(1536),
    user_id_param uuid,
    match_count int DEFAULT 5
  )
  RETURNS TABLE (id uuid, content text, similarity float)
  LANGUAGE sql STABLE
  AS $$
    SELECT id, content,
      1 - (embedding <=> query_embedding) as similarity
    FROM documents
    WHERE user_id = user_id_param OR is_public = true
    ORDER BY embedding <=> query_embedding
    LIMIT match_count;
  $$;
`;
