'use client'

import Link from 'next/link'
import ChatWidget from '@/app/components/ChatWidget'
import { FaRocket, FaLock, FaSearch, FaBullseye, FaFileUpload, FaCog } from 'react-icons/fa'

export default function Home() {
  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; }

        .home-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%);
          padding: 40px 20px;
          position: relative;
          overflow: hidden;
        }

        .home-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(15, 15, 15, 0.05) 0%, transparent 70%);
          transform: translate(-50%, -30%);
          pointer-events: none;
        }

        .home-content {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .hero-section {
          text-align: center;
          margin-bottom: 80px;
          animation: fade-in 0.6s ease;
          padding: 40px 0;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hero-section h1 {
          font-size: 56px;
          font-weight: 800;
          margin-bottom: 20px;
          background: linear-gradient(135deg, #0f0f0f 0%, #333 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.1;
          letter-spacing: -1px;
        }

        .hero-section p {
          font-size: 18px;
          color: #666;
          margin-bottom: 40px;
          line-height: 1.7;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }

        .button-group {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .btn {
          padding: 16px 36px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .btn-primary {
          background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
        }

        .btn-secondary {
          background: white;
          color: #0f0f0f;
          border: 2px solid #0f0f0f;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .btn-secondary:hover {
          background: #0f0f0f;
          color: white;
          transform: translateY(-3px);
        }

        .status-badge {
          display: inline-block;
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
          color: #1b5e20;
          padding: 10px 20px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 28px;
          letter-spacing: 0.8px;
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.15);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 28px;
          margin-top: 80px;
        }

        .feature-card {
          background: white;
          padding: 40px 32px;
          border-radius: 20px;
          border: 2px solid #f0f0f0;
          transition: all 0.3s ease;
          text-align: center;
          position: relative;
          overflow: hidden;
          animation: slide-up 0.6s ease both;
        }

        .feature-card:nth-child(1) { animation-delay: 0.1s; }
        .feature-card:nth-child(2) { animation-delay: 0.2s; }
        .feature-card:nth-child(3) { animation-delay: 0.3s; }
        .feature-card:nth-child(4) { animation-delay: 0.4s; }
        .feature-card:nth-child(5) { animation-delay: 0.5s; }
        .feature-card:nth-child(6) { animation-delay: 0.6s; }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(15, 15, 15, 0.02) 0%, transparent 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .feature-card:hover {
          border-color: #0f0f0f;
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.12);
          transform: translateY(-8px);
        }

        .feature-card:hover::before {
          opacity: 1;
        }

        .feature-icon {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 32px;
          color: #0f0f0f;
          transition: all 0.3s ease;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
        }

        .feature-card:hover .feature-icon {
          background: linear-gradient(135deg, #0f0f0f 0%, #333 100%);
          color: white;
          transform: scale(1.1) rotate(5deg);
        }

        .feature-card h3 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 14px;
          color: #0f0f0f;
        }

        .feature-card p {
          font-size: 15px;
          color: #777;
          line-height: 1.6;
          letter-spacing: 0.3px;
        }

        .footer {
          text-align: center;
          margin-top: 100px;
          padding-top: 40px;
          border-top: 2px solid #e0e0e0;
          color: #999;
          font-size: 14px;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .hero-section {
            padding: 20px 0;
            margin-bottom: 60px;
          }

          .hero-section h1 {
            font-size: 36px;
            letter-spacing: 0;
          }

          .hero-section p {
            font-size: 16px;
            margin-bottom: 30px;
          }

          .button-group {
            flex-direction: column;
            gap: 12px;
          }

          .btn {
            width: 100%;
            justify-content: center;
            padding: 14px 28px;
            font-size: 15px;
          }

          .features-grid {
            grid-template-columns: 1fr;
            gap: 20px;
            margin-top: 60px;
          }

          .feature-card {
            padding: 28px 20px;
            border-radius: 16px;
          }

          .feature-icon {
            width: 60px;
            height: 60px;
            font-size: 28px;
            margin-bottom: 16px;
          }

          .feature-card h3 {
            font-size: 18px;
          }

          .feature-card p {
            font-size: 14px;
          }
        }
      `}</style>

      <div className="home-container">
        <div className="home-content">
          <div className="hero-section">
            <div className="status-badge">Production Ready</div>
            <h1>Ask Your Documents Anything</h1>
            <p>
              Upload your business documents and get instant, intelligent answers powered by AI.
              Our RAG system searches your knowledge base and provides accurate, context-aware responses.
            </p>
            <div className="button-group">
              <Link href="/admin" className="btn btn-primary">
                <FaFileUpload size={18} />
                Manage Documents
              </Link>
              <a href="#chat" className="btn btn-secondary">
                <FaSearch size={18} />
                Start Chatting
              </a>
            </div>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FaRocket />
              </div>
              <h3>Lightning Fast</h3>
              <p>Streaming responses with real-time token generation for instant feedback.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaLock />
              </div>
              <h3>Secure & Private</h3>
              <p>Your documents are encrypted and stored securely with per-user data isolation.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaSearch />
              </div>
              <h3>Semantic Search</h3>
              <p>AI-powered vector search finds the most relevant document chunks automatically.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaBullseye />
              </div>
              <h3>Accurate Answers</h3>
              <p>Powered by GPT-4o-mini for high-quality, context-aware responses.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaFileUpload />
              </div>
              <h3>Easy Upload</h3>
              <p>Upload text, PDFs, or CSV files and they're instantly indexed and searchable.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaCog />
              </div>
              <h3>Rate Limited</h3>
              <p>Built-in rate limiting (20 chat, 10 uploads/minute) prevents abuse.</p>
            </div>
          </div>

          <div className="footer">
            <p>Powered by Next.js 16, Supabase, and OpenAI</p>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      <ChatWidget
        apiUrl="/api/chat"
        botName="AI Assistant"
        welcomeMessage="Hi there! Upload documents in the admin panel, then ask me anything about them. I'll search your knowledge base and provide instant answers."
      />
    </>
  )
}

