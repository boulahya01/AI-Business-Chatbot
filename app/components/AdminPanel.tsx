"use client"

import { useState, useEffect, useCallback } from "react"

interface Document {
  id: string
  content: string
  metadata: { source?: string; [key: string]: unknown }
  created_at: string
}

interface Toast {
  id: string
  type: "success" | "error"
  message: string
}

export default function AdminPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [content, setContent] = useState("")
  const [source, setSource] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [search, setSearch] = useState("")
  const [chunksCreated, setChunksCreated] = useState<number | null>(null)

  const addToast = (type: "success" | "error", message: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }

  const fetchDocuments = useCallback(async () => {
    setFetching(true)
    try {
      const res = await fetch("/api/documents")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setDocuments(data)
    } catch {
      addToast("error", "Failed to load documents from Supabase.")
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleIngest = async () => {
    if (!content.trim()) {
      addToast("error", "Please paste some content before submitting.")
      return
    }
    setLoading(true)
    setChunksCreated(null)
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: content,
          metadata: { source: source.trim() || "manual-upload" },
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setChunksCreated(data.chunks)
      addToast("success", `Successfully ingested ${data.chunks} chunks into the knowledge base.`)
      setContent("")
      setSource("")
      fetchDocuments()
    } catch {
      addToast("error", "Ingest failed. Check your OpenAI API key and Supabase connection.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setDocuments((prev) => prev.filter((d) => d.id !== id))
      addToast("success", "Chunk deleted successfully.")
    } catch {
      addToast("error", "Failed to delete chunk.")
    } finally {
      setDeleting(null)
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm("Delete ALL document chunks? This cannot be undone.")) return
    try {
      await Promise.all(documents.map((d) => fetch(`/api/documents/${d.id}`, { method: "DELETE" })))
      setDocuments([])
      addToast("success", "All chunks deleted.")
    } catch {
      addToast("error", "Failed to delete all chunks.")
    }
  }

  const filtered = documents.filter(
    (d) =>
      d.content.toLowerCase().includes(search.toLowerCase()) ||
      d.metadata?.source?.toLowerCase().includes(search.toLowerCase())
  )

  const totalWords = documents.reduce((acc, d) => acc + d.content.split(" ").length, 0)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=Syne:wght@700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #f4f4f5; font-family: 'DM Sans', sans-serif; color: #111; }

        .admin-root { min-height: 100vh; background: #f4f4f5; }

        .topbar {
          background: #0f0f0f;
          padding: 0 32px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .topbar-left { display: flex; align-items: center; gap: 14px; }
        .topbar-logo {
          font-family: 'Syne', sans-serif;
          font-size: 17px;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .topbar-logo span { color: #22c55e; }
        .topbar-badge {
          font-size: 10px;
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.5);
          padding: 3px 10px;
          border-radius: 100px;
          letter-spacing: 0.06em;
        }
        .topbar-right { display: flex; align-items: center; gap: 10px; }
        .btn-home {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          background: none;
          border: 0.5px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          padding: 6px 14px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.15s, border-color 0.15s;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .btn-home:hover { color: #fff; border-color: rgba(255,255,255,0.3); }

        .page-body { max-width: 900px; margin: 0 auto; padding: 32px 24px 80px; }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 28px;
        }
        .stat-card {
          background: #fff;
          border-radius: 14px;
          padding: 18px 20px;
          border: 0.5px solid #e4e4e7;
        }
        .stat-label { font-size: 11px; color: #999; margin-bottom: 6px; letter-spacing: 0.04em; text-transform: uppercase; }
        .stat-value { font-family: 'Syne', sans-serif; font-size: 26px; color: #111; }
        .stat-sub { font-size: 11px; color: #bbb; margin-top: 3px; }

        .section {
          background: #fff;
          border-radius: 16px;
          border: 0.5px solid #e4e4e7;
          margin-bottom: 20px;
          overflow: hidden;
        }
        .section-header {
          padding: 18px 22px 16px;
          border-bottom: 0.5px solid #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          color: #111;
        }
        .section-desc { font-size: 12px; color: #999; margin-top: 2px; }
        .section-body { padding: 20px 22px; }

        label { font-size: 13px; font-weight: 500; color: #444; display: block; margin-bottom: 7px; }

        textarea, input[type="text"] {
          width: 100%;
          background: #fafafa;
          border: 0.5px solid #e4e4e7;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #111;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          resize: vertical;
        }
        textarea:focus, input[type="text"]:focus {
          border-color: #0f0f0f;
          box-shadow: 0 0 0 3px rgba(0,0,0,0.06);
        }
        textarea { min-height: 180px; line-height: 1.6; }

        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }

        .char-count { font-size: 11px; color: #bbb; text-align: right; margin-top: 5px; }

        .btn-primary {
          width: 100%;
          margin-top: 18px;
          background: #0f0f0f;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 13px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-primary:hover:not(:disabled) { background: #2a2a2a; }
        .btn-primary:active:not(:disabled) { transform: scale(0.99); }
        .btn-primary:disabled { background: #d4d4d4; cursor: not-allowed; }

        .success-banner {
          margin-top: 14px;
          background: #f0fdf4;
          border: 0.5px solid #bbf7d0;
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 13px;
          color: #15803d;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .docs-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }
        .search-wrap { position: relative; flex: 1; }
        .search-wrap svg {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          color: #bbb;
        }
        .search-input {
          padding-left: 34px !important;
          background: #fafafa;
          border: 0.5px solid #e4e4e7;
          border-radius: 9px;
          height: 36px;
          font-size: 13px;
          width: 100%;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          color: #111;
          transition: border-color 0.15s;
        }
        .search-input:focus { border-color: #0f0f0f; }

        .btn-danger-sm {
          font-size: 12px;
          color: #dc2626;
          background: #fff0f0;
          border: 0.5px solid #fca5a5;
          border-radius: 8px;
          padding: 7px 14px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
          transition: background 0.15s;
        }
        .btn-danger-sm:hover { background: #fee2e2; }

        .doc-list { display: flex; flex-direction: column; gap: 10px; }

        .doc-card {
          background: #fafafa;
          border: 0.5px solid #e4e4e7;
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          gap: 14px;
          align-items: flex-start;
          transition: border-color 0.15s;
        }
        .doc-card:hover { border-color: #d4d4d4; }
        .doc-index {
          font-size: 10px;
          color: #bbb;
          background: #ececec;
          border-radius: 6px;
          padding: 3px 8px;
          flex-shrink: 0;
          margin-top: 2px;
          font-family: monospace;
        }
        .doc-body { flex: 1; min-width: 0; }
        .doc-content {
          font-size: 13px;
          color: #333;
          line-height: 1.55;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .doc-meta { display: flex; align-items: center; gap: 10px; }
        .doc-tag {
          font-size: 10px;
          background: #eff6ff;
          color: #1d4ed8;
          border-radius: 100px;
          padding: 2px 9px;
          border: 0.5px solid #bfdbfe;
        }
        .doc-date { font-size: 10px; color: #bbb; }
        .btn-delete {
          background: none;
          border: 0.5px solid #e4e4e7;
          border-radius: 8px;
          padding: 6px 10px;
          cursor: pointer;
          color: #bbb;
          font-size: 13px;
          flex-shrink: 0;
          transition: color 0.15s, border-color 0.15s, background 0.15s;
          display: flex;
          align-items: center;
        }
        .btn-delete:hover { color: #dc2626; border-color: #fca5a5; background: #fff0f0; }
        .btn-delete:disabled { opacity: 0.4; cursor: not-allowed; }

        .empty-state {
          text-align: center;
          padding: 48px 20px;
          color: #bbb;
        }
        .empty-state svg { margin-bottom: 12px; color: #e4e4e7; }
        .empty-state p { font-size: 14px; color: #999; }
        .empty-state span { font-size: 12px; color: #bbb; display: block; margin-top: 4px; }

        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 8px;
          height: 14px;
          margin-bottom: 8px;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .toast-container {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 9999;
          pointer-events: none;
        }
        .toast {
          padding: 11px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          animation: toast-in 0.2s ease;
          pointer-events: auto;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        @keyframes toast-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .toast-success { background: #0f0f0f; color: #fff; }
        .toast-error { background: #dc2626; color: #fff; }

        .tips-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 14px;
        }
        .tip-card {
          background: #fafafa;
          border: 0.5px solid #e4e4e7;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 12px;
          color: #666;
          line-height: 1.5;
        }
        .tip-card strong { display: block; color: #111; font-size: 12px; margin-bottom: 3px; }

        @media (max-width: 640px) {
          .stats-row { grid-template-columns: 1fr 1fr; }
          .field-row { grid-template-columns: 1fr; }
          .tips-row { grid-template-columns: 1fr; }
          .page-body { padding: 20px 14px 60px; }
        }
      `}</style>

      <div className="admin-root">
        {/* Topbar */}
        <nav className="topbar">
          <div className="topbar-left">
            <div className="topbar-logo">AI<span>.</span>Admin</div>
            <div className="topbar-badge">KNOWLEDGE BASE</div>
          </div>
          <div className="topbar-right">
            <a href="/" className="btn-home">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Back to App
            </a>
          </div>
        </nav>

        <div className="page-body">
          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Total chunks</div>
              <div className="stat-value">{fetching ? "—" : documents.length}</div>
              <div className="stat-sub">stored in Supabase</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total words</div>
              <div className="stat-value">{fetching ? "—" : totalWords.toLocaleString()}</div>
              <div className="stat-sub">across all documents</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Sources</div>
              <div className="stat-value">
                {fetching ? "—" : new Set(documents.map((d) => d.metadata?.source).filter(Boolean)).size}
              </div>
              <div className="stat-sub">unique sources</div>
            </div>
          </div>

          {/* Ingest section */}
          <div className="section">
            <div className="section-header">
              <div>
                <div className="section-title">Ingest content</div>
                <div className="section-desc">Paste text content to embed and store in the knowledge base</div>
              </div>
            </div>
            <div className="section-body">
              <label>Content</label>
              <textarea
                placeholder="Paste your content here — company info, FAQs, product descriptions, policies, anything the chatbot should know..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
              />
              <div className="char-count">{content.length.toLocaleString()} characters</div>

              <div className="field-row">
                <div>
                  <label>Source name</label>
                  <input
                    type="text"
                    placeholder="e.g. company-faq, pricing-page, about-us"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label>Estimated chunks</label>
                  <input
                    type="text"
                    value={content.length > 0 ? `~${Math.ceil(content.length / 500)} chunks` : "—"}
                    readOnly
                    style={{ color: "#999", cursor: "default" }}
                  />
                </div>
              </div>

              <button className="btn-primary" onClick={handleIngest} disabled={loading || !content.trim()}>
                {loading ? (
                  <>
                    <div className="spinner" />
                    Embedding and storing...
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Submit & ingest
                  </>
                )}
              </button>

              {chunksCreated !== null && (
                <div className="success-banner">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {chunksCreated} chunks created and embedded successfully.
                </div>
              )}

              <div className="tips-row">
                <div className="tip-card"><strong>What to paste</strong>FAQs, product info, policies, about page, pricing — any text the bot should know.</div>
                <div className="tip-card"><strong>Chunk size</strong>Text is split into ~500 character chunks. Longer content = more chunks = better coverage.</div>
                <div className="tip-card"><strong>Source name</strong>Label your content so you know where each chunk came from. Useful for debugging.</div>
              </div>
            </div>
          </div>

          {/* Documents section */}
          <div className="section">
            <div className="section-header">
              <div>
                <div className="section-title">Stored document chunks</div>
                <div className="section-desc">{documents.length} chunks in the knowledge base</div>
              </div>
              {documents.length > 0 && (
                <button className="btn-danger-sm" onClick={handleDeleteAll}>
                  Delete all
                </button>
              )}
            </div>
            <div className="section-body">
              {documents.length > 0 && (
                <div className="docs-toolbar">
                  <div className="search-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input
                      className="search-input"
                      type="text"
                      placeholder="Search chunks..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <span style={{ fontSize: 12, color: "#bbb", whiteSpace: "nowrap" }}>
                    {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {fetching ? (
                <div style={{ padding: "8px 0" }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div className="skeleton" style={{ width: "100%", height: 60 }} />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  <p>{search ? "No chunks match your search." : "No documents yet."}</p>
                  <span>{search ? "Try a different keyword." : "Paste content above and click Submit & Ingest."}</span>
                </div>
              ) : (
                <div className="doc-list">
                  {filtered.map((doc, i) => (
                    <div key={doc.id} className="doc-card">
                      <div className="doc-index">#{i + 1}</div>
                      <div className="doc-body">
                        <div className="doc-content">{doc.content}</div>
                        <div className="doc-meta">
                          {doc.metadata?.source && (
                            <span className="doc-tag">{doc.metadata.source}</span>
                          )}
                          <span className="doc-date">
                            {doc.created_at
                              ? new Date(doc.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </span>
                          <span className="doc-date">{doc.content.split(" ").length} words</span>
                        </div>
                      </div>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(doc.id)}
                        disabled={deleting === doc.id}
                        aria-label="Delete chunk"
                      >
                        {deleting === doc.id ? (
                          <div style={{ width: 13, height: 13, border: "2px solid #fca5a5", borderTopColor: "#dc2626", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toasts */}
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              {t.type === "success" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              )}
              {t.message}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}