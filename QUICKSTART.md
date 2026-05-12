# Quick Start Guide

## Project Complete! 🎉

Everything is consolidated, wired, and production-ready.

---

## 1️⃣ Local Development

```bash
# Install dependencies
npm install

# Set up env variables
cp .env.local.example .env.local
# Fill in: SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE_KEY, OPENAI_API_KEY

# Start dev server
npm run dev

# Open http://localhost:3000
```

---

## 2️⃣ Initial Testing (Demo Mode)

### Without Authentication
- Homepage works with ChatWidget
- Upload documents (no auth required for demo)
- Chat works with uploaded documents
- Chat history saved to localStorage

### Enable Authentication (Production)
1. Go to `/admin` to login
2. Supabase Auth will handle login/signup
3. All documents scoped to user_id
4. Chat history persistent per session

---

## 3️⃣ Production Database Setup

**Run in Supabase SQL Editor** (see `PRODUCTION.md` for full SQL):

```sql
-- 1. Enable pgvector
create extension if not exists vector;

-- 2. Update documents table with user tracking
ALTER TABLE documents 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN is_public boolean DEFAULT false;

-- 3. Create chat_messages table
CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id varchar(100) NOT NULL,
  role varchar(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 4. Update RPC for user filtering
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  user_id_param uuid DEFAULT NULL,
  match_count int DEFAULT 5
)
RETURNS TABLE (id uuid, content text, similarity float)
LANGUAGE sql STABLE
AS $$
  SELECT id, content,
    1 - (embedding <=> query_embedding) as similarity
  FROM documents
  WHERE (user_id_param IS NULL OR user_id = user_id_param) 
    OR is_public = true
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

---

## 4️⃣ Deploy to Vercel

```bash
# Commit and push
git add .
git commit -m "Production-ready RAG chatbot"
git push origin main

# In Vercel Dashboard:
# 1. Import GitHub repo
# 2. Add environment variables:
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY
#    - SUPABASE_SERVICE_ROLE_KEY
#    - OPENAI_API_KEY
# 3. Deploy
```

---

## 5️⃣ API Endpoints

### Chat (Streaming)
```
POST /api/chat
{
  "message": "What is in the documents?",
  "sessionId": "uuid-for-history"  // optional
}
```

### Ingest Documents
```
POST /api/ingest
{
  "text": "Your document content...",
  "metadata": { "source": "company-docs" }
}
```

### Get Documents
```
GET /api/documents
```

### Delete Document
```
DELETE /api/documents/[id]
```

### Chat History
```
GET /api/chat-history?sessionId=xxx
DELETE /api/chat-history?sessionId=xxx
```

---

## 6️⃣ Features Available

✅ **Admin Panel**
- Email/password authentication
- Upload & manage documents
- See document list with previews
- Delete individual chunks
- Bulk operations
- Toast notifications

✅ **Chat Widget**
- Stream responses in real-time
- Persistent chat history (per session)
- Auto-scroll to latest message
- Clear history button
- Responsive design

✅ **Production**
- Per-user document isolation
- Rate limiting (20 chat, 10 upload/min)
- File upload support (PDF, CSV, TXT)
- Audit logging
- Error handling
- RLS policies

---

## 7️⃣ File Structure (Final)

```
project/
├── app/
│   ├── api/
│   │   ├── chat/route.ts
│   │   ├── chat-history/route.ts
│   │   ├── documents/route.ts
│   │   ├── documents/[id]/route.ts
│   │   └── ingest/route.ts
│   ├── components/
│   │   ├── AdminAuth.tsx
│   │   ├── AdminPanel.tsx
│   │   └── ChatWidget.tsx
│   ├── admin/
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   ├── chunker.ts
│   ├── file-parser.ts
│   ├── rate-limiter.ts
│   ├── database-migrations.ts
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       └── middleware.ts
├── public/
├── .env.local (create from .env.local.example)
├── next.config.ts
├── tsconfig.json
├── package.json
├── README.md
├── PRODUCTION.md
├── PROJECT_STATUS.md
└── CONSOLIDATION_REPORT.md
```

---

## 8️⃣ Troubleshooting

### Build fails
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Supabase connection error
- Check env variables are correct
- Verify API keys in Supabase dashboard
- Test connection: `npm run dev` and check console

### Chat not working
- Ensure documents are uploaded to admin panel
- Check OpenAI API key is valid
- Verify Supabase pgvector extension is enabled

### Rate limiting too strict
- Edit `lib/rate-limiter.ts` to adjust limits
- Production: use Redis instead of in-memory

---

## 📚 Documentation

- `README.md` - Main project documentation
- `PRODUCTION.md` - Production features & setup guide
- `PROJECT_STATUS.md` - Complete status & checklist
- `CONSOLIDATION_REPORT.md` - What was fixed & wired
- `AGENTS.md` - AI agent architecture notes
- `CLAUDE.md` - Copilot guidelines

---

## ✨ You're All Set!

The project is **100% consolidated, wired, and ready**. 

No duplicates. No conflicts. All endpoints connected.

**Time to deploy!** 🚀
