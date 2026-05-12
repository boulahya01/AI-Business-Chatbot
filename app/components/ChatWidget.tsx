'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatWidgetProps {
  apiUrl?: string
  botName?: string
  welcomeMessage?: string
}

export default function ChatWidget({
  apiUrl = '/api/chat',
  botName = 'AI Assistant',
  welcomeMessage = 'Hi there! How can I help you today?',
}: ChatWidgetProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setStreamingContent('')

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: crypto.randomUUID(),
        }),
      })

      if (!res.ok) throw new Error('Request failed')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          full += chunk
          setStreamingContent(full)
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: full,
          timestamp: new Date(),
        },
      ])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
      setStreamingContent('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap');

        .cw-root * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; }

        .cw-toggle {
          position: fixed;
          bottom: 28px;
          right: 28px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #0f0f0f;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9998;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 24px rgba(0,0,0,0.18);
        }
        .cw-toggle:hover { transform: scale(1.07); box-shadow: 0 6px 28px rgba(0,0,0,0.24); }
        .cw-toggle svg { transition: transform 0.25s ease, opacity 0.2s ease; }

        .cw-window {
          position: fixed;
          bottom: 96px;
          right: 28px;
          width: 380px;
          height: 560px;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.06);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          z-index: 9997;
          transform-origin: bottom right;
          animation: cw-in 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        @keyframes cw-in {
          from { opacity: 0; transform: scale(0.88) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .cw-window.closing {
          animation: cw-out 0.16s ease forwards;
        }
        @keyframes cw-out {
          to { opacity: 0; transform: scale(0.92) translateY(8px); }
        }

        .cw-header {
          padding: 16px 18px;
          background: #0f0f0f;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .cw-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #2a2a2a;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
        }
        .cw-avatar-dot {
          position: absolute;
          bottom: 1px;
          right: 1px;
          width: 9px;
          height: 9px;
          background: #22c55e;
          border-radius: 50%;
          border: 2px solid #0f0f0f;
        }
        .cw-header-info { flex: 1; }
        .cw-bot-name { font-size: 14px; font-weight: 500; color: #ffffff; }
        .cw-status { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 1px; }
        .cw-close {
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.5);
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }
        .cw-close:hover { color: #ffffff; }

        .cw-messages {
          flex: 1;
          overflow-y: auto;
          padding: 18px 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          background: #f9f9f9;
          scroll-behavior: smooth;
        }
        .cw-messages::-webkit-scrollbar { width: 4px; }
        .cw-messages::-webkit-scrollbar-track { background: transparent; }
        .cw-messages::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }

        .cw-msg-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          animation: cw-msg-in 0.18s ease forwards;
        }
        @keyframes cw-msg-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cw-msg-row.user { align-items: flex-end; }
        .cw-msg-row.assistant { align-items: flex-start; }

        .cw-bubble {
          max-width: 82%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.55;
          word-break: break-word;
          white-space: pre-wrap;
        }
        .cw-bubble.user {
          background: #0f0f0f;
          color: #ffffff;
          border-bottom-right-radius: 4px;
        }
        .cw-bubble.assistant {
          background: #ffffff;
          color: #1a1a1a;
          border: 0.5px solid #ebebeb;
          border-bottom-left-radius: 4px;
        }

        .cw-timestamp { font-size: 10px; color: #bbb; padding: 0 4px; }

        .cw-typing {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 12px 14px;
          background: #ffffff;
          border: 0.5px solid #ebebeb;
          border-radius: 16px;
          border-bottom-left-radius: 4px;
          width: fit-content;
        }
        .cw-typing span {
          width: 6px;
          height: 6px;
          background: #ccc;
          border-radius: 50%;
          animation: cw-bounce 1.2s infinite;
        }
        .cw-typing span:nth-child(2) { animation-delay: 0.2s; }
        .cw-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes cw-bounce {
          0%, 60%, 100% { transform: translateY(0); background: #ccc; }
          30% { transform: translateY(-5px); background: #999; }
        }

        .cw-streaming {
          background: #ffffff;
          color: #1a1a1a;
          border: 0.5px solid #ebebeb;
          border-radius: 16px;
          border-bottom-left-radius: 4px;
          padding: 10px 14px;
          font-size: 14px;
          line-height: 1.55;
          max-width: 82%;
          word-break: break-word;
          white-space: pre-wrap;
        }
        .cw-cursor {
          display: inline-block;
          width: 2px;
          height: 14px;
          background: #0f0f0f;
          margin-left: 2px;
          vertical-align: middle;
          animation: cw-blink 0.8s infinite;
        }
        @keyframes cw-blink { 0%,100%{opacity:1} 50%{opacity:0} }

        .cw-footer {
          padding: 12px 14px;
          background: #ffffff;
          border-top: 0.5px solid #ebebeb;
          flex-shrink: 0;
        }
        .cw-input-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          background: #f4f4f4;
          border-radius: 14px;
          padding: 8px 8px 8px 14px;
          transition: box-shadow 0.15s;
        }
        .cw-input-row:focus-within {
          box-shadow: 0 0 0 2px #0f0f0f;
        }
        .cw-textarea {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          resize: none;
          font-size: 14px;
          color: #1a1a1a;
          line-height: 1.5;
          max-height: 120px;
          min-height: 22px;
          font-family: 'DM Sans', sans-serif;
        }
        .cw-textarea::placeholder { color: #aaa; }
        .cw-send {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: #0f0f0f;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s, transform 0.1s;
        }
        .cw-send:hover:not(:disabled) { background: #333; }
        .cw-send:active:not(:disabled) { transform: scale(0.94); }
        .cw-send:disabled { background: #e0e0e0; cursor: not-allowed; }
        .cw-hint { font-size: 11px; color: #ccc; text-align: center; margin-top: 8px; }

        @media (max-width: 440px) {
          .cw-window { width: calc(100vw - 24px); right: 12px; bottom: 80px; }
          .cw-toggle { right: 16px; bottom: 16px; }
        }
      `}</style>

      <div className="cw-root">
        {/* Toggle button */}
        <button
          className="cw-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close chat' : 'Open chat'}
        >
          {open ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}
        </button>

        {/* Chat window */}
        {open && (
          <div className="cw-window" role="dialog" aria-label="Chat window">
            {/* Header */}
            <div className="cw-header">
              <div className="cw-avatar">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                <div className="cw-avatar-dot" />
              </div>
              <div className="cw-header-info">
                <div className="cw-bot-name">{botName}</div>
                <div className="cw-status">Online · Replies instantly</div>
              </div>
              <button
                className="cw-close"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="cw-messages" role="log" aria-live="polite">
              {messages.map((msg) => (
                <div key={msg.id} className={`cw-msg-row ${msg.role}`}>
                  <div className={`cw-bubble ${msg.role}`}>{msg.content}</div>
                  <div className="cw-timestamp">{formatTime(msg.timestamp)}</div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && !streamingContent && (
                <div className="cw-msg-row assistant">
                  <div className="cw-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}

              {/* Streaming response */}
              {streamingContent && (
                <div className="cw-msg-row assistant">
                  <div className="cw-streaming">
                    {streamingContent}
                    <span className="cw-cursor" aria-hidden="true" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="cw-footer">
              <div className="cw-input-row">
                <textarea
                  ref={inputRef}
                  className="cw-textarea"
                  placeholder="Type a message..."
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  aria-label="Message input"
                  disabled={loading}
                />
                <button
                  className="cw-send"
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <div className="cw-hint">
                Press Enter to send · Shift+Enter for new line
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
