"use client";

import React, { useState, useRef, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { PageHeader } from '@/components/PageHeader';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Helper to format session time range (robust to missing/invalid dates)
function formatSessionTime(session: any) {
  try {
    if (session.startTime && session.endTime) {
      const start = new Date(session.startTime);
      const end = new Date(session.endTime);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        if (start.toDateString() === end.toDateString()) {
          return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, ${start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`;
        } else {
          return `${start.toLocaleString()} - ${end.toLocaleString()}`;
        }
      }
    } else if (session.startTime) {
      const start = new Date(session.startTime);
      if (!isNaN(start.getTime())) {
        return `${start.toLocaleString()}`;
      }
    } else if (session.date) {
      const date = new Date(session.date);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString();
      }
    }
  } catch {}
  return '';
}

// Helper to check if a session suggestion block was present in the response
function hasSessionSuggestionBlock(content: string) {
  return /<!--SESSION_SUGGESTIONS_START-->[\s\S]*?<!--SESSION_SUGGESTIONS_END-->/.test(content);
}

export default function AssistantPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am your Smart Assistant. I can suggest sessions and book them for you. How can I help?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionDialog, setSessionDialog] = useState<{ open: boolean, session: any | null }>({ open: false, session: null });
  const [booking, setBooking] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [suggestionDetails, setSuggestionDetails] = useState<Record<string, any>>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Helper to extract session suggestions from assistant message
  function parseSessionSuggestions(content: string) {
    // Look for a JSON block in the message (delimited by ```json ... ``` or <!--SESSION_SUGGESTIONS_START--> ... <!--SESSION_SUGGESTIONS_END-->)
    const jsonBlock = content.match(/```json([\s\S]*?)```/) || content.match(/<!--SESSION_SUGGESTIONS_START-->([\s\S]*?)<!--SESSION_SUGGESTIONS_END-->/);
    if (jsonBlock) {
      try {
        const json = JSON.parse(jsonBlock[1].trim());
        if (Array.isArray(json)) return json;
        if (json.sessions && Array.isArray(json.sessions)) return json.sessions;
      } catch {}
    }
    return null;
  }

  // Streaming fetch for assistant response
  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');
    setLoading(true);
    setError(null);
    setStreamedResponse('');
    try {
      const res = await fetch('/api/assistant/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content: input }] }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Error contacting Claude');
        setLoading(false);
        return;
      }
      const data = await res.json();
      let text = data.completion;
      // Pre-render session suggestion block (if present)
      const sessionBlockMatch = text.match(/<!--SESSION_SUGGESTIONS_START-->[\s\S]*?<!--SESSION_SUGGESTIONS_END-->/);
      let preRenderedBlock = '';
      if (sessionBlockMatch) {
        // Remove the block from the streaming text
        text = text.replace(sessionBlockMatch[0], '');
        // We'll add the block to the final message, but not stream it
        preRenderedBlock = sessionBlockMatch[0];
      }
      let i = 0;
      function streamStep() {
        setStreamedResponse(text.slice(0, i));
        if (i < text.length) {
          i += Math.max(2, Math.floor(Math.random() * 6)); // Faster streaming
          setTimeout(streamStep, 4 + Math.random() * 10); // Faster streaming
        } else {
          // Reconstruct the full message with the pre-rendered block
          setMessages(msgs => [...msgs, { role: 'assistant', content: text + preRenderedBlock }]);
          setStreamedResponse('');
          setLoading(false);
        }
      }
      streamStep();
    } catch (e: any) {
      setError(e.message || 'Error contacting Claude');
      setLoading(false);
    }
  };

  // Fetch session details from backend when opening modal
  const handleSessionClick = async (session: any) => {
    try {
      const res = await fetch(`/api/sessions/${session.id}`);
      if (res.ok) {
        const data = await res.json();
        setSessionDialog({ open: true, session: data.session });
      } else {
        setSessionDialog({ open: true, session }); // fallback to card data
      }
    } catch {
      setSessionDialog({ open: true, session });
    }
  };

  // Book a session and show green confirmation
  const handleBookSession = async (sessionId: string) => {
    setBooking(sessionId);
    setBooked(false);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/attendance`, { method: 'POST' });
      if (res.ok) {
        setBooked(true);
        setTimeout(() => {
          setSessionDialog({ open: false, session: null });
          setBooked(false);
        }, 1200);
      } else {
        const err = await res.json();
        setSessionDialog(sd => ({ ...sd, session: { ...sd.session, bookingError: err.error || 'Failed to book session' } }));
      }
    } catch (e: any) {
      setSessionDialog(sd => ({ ...sd, session: { ...sd.session, bookingError: e.message || 'Failed to book session' } }));
    } finally {
      setBooking(null);
    }
  };

  // Fetch full details for all session suggestions when they change
  useEffect(() => {
    const lastAssistantMsg = messages.filter((m: { role: string }) => m.role === 'assistant').slice(-1)[0];
    if (!lastAssistantMsg) return;
    const suggestions: { id: string }[] | null = parseSessionSuggestions(lastAssistantMsg.content);
    if (suggestions && suggestions.length > 0) {
      const missingIds = suggestions.filter((s: { id: string }) => !suggestionDetails[s.id]).map((s: { id: string }) => s.id);
      if (missingIds.length > 0) {
        setLoadingSuggestions(true);
        Promise.all(missingIds.map((id: string) =>
          fetch(`/api/sessions/${id}`).then(res => res.ok ? res.json() : null)
        )).then(results => {
          const details: Record<string, any> = {};
          results.forEach((res, i) => {
            if (res && res.session) details[missingIds[i]] = res.session;
          });
          setSuggestionDetails(prev => ({ ...prev, ...details }));
        }).finally(() => setLoadingSuggestions(false));
      }
    }
    // eslint-disable-next-line
  }, [messages]);

  // Scroll to bottom on new message/stream
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedResponse]);

  return (
    <SidebarLayout>
      <PageHeader icon={<Sparkles className="w-10 h-10" />} title="Smart Assistant" />
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-0 mt-6 flex flex-col h-[80vh] min-h-[600px]">
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 px-8 py-8" style={{ background: '#f7f8fa' }}>
          {messages.map((msg, i) => {
            if (msg.role === 'assistant') {
              const suggestions = parseSessionSuggestions(msg.content);
              return (
                <div key={i} className="flex justify-start">
                  <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 max-w-2xl">
                    <div className="chat-markdown prose prose-sm max-w-none mb-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content.replace(/```json([\s\S]*?)```/g, '').replace(/<!--SESSION_SUGGESTIONS_START-->[\s\S]*?<!--SESSION_SUGGESTIONS_END-->/g, '')}</ReactMarkdown>
                    </div>
                    {suggestions && hasSessionSuggestionBlock(msg.content) ? (
                      suggestions.length > 0 ? (
                        <div className="mt-2 space-y-2">
                          <div className="font-semibold text-xs text-gray-500 mb-1">Session Suggestions:</div>
                          {suggestions.map((session: { id: string; title: string }) => {
                            const details = suggestionDetails[session.id];
                            return (
                              <div
                                key={session.id}
                                className="border rounded-xl p-4 bg-blue-50 hover:bg-blue-100 transition cursor-pointer flex flex-col gap-2 shadow-sm"
                                onClick={() => handleSessionClick(session)}
                                style={{ minWidth: 0 }}
                              >
                                <div className="font-bold text-[#002248] text-base mb-1 truncate">{details?.title || session.title}</div>
                                {details ? (
                                  <>
                                    <div className="flex flex-col gap-1 text-xs text-gray-700">
                                      {details.mentor && (
                                        <div><span className="font-semibold">Mentor:</span> {details.mentor.firstName} {details.mentor.lastName}</div>
                                      )}
                                      {details.date && (
                                        <div><span className="font-semibold">Date:</span> {formatSessionTime(details)}</div>
                                      )}
                                      {details.location && (
                                        <div><span className="font-semibold">Location:</span> {details.location}</div>
                                      )}
                                      {details.category && (
                                        <div><span className="font-semibold">Category:</span> {details.category}</div>
                                      )}
                                    </div>
                                    {details.description && (
                                      <div className="text-xs text-gray-600 mt-2 border-t border-blue-100 pt-2 line-clamp-3" style={{ whiteSpace: 'pre-line' }}>{details.description}</div>
                                    )}
                                  </>
                                ) : (
                                  <div className="text-xs text-gray-400 italic">Loading details...</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-gray-500 italic">No sessions found that match your request.</div>
                      )
                    ) : null}
                  </div>
                </div>
              );
            } else {
              return (
                <div key={i} className="flex justify-end">
                  <div className="px-4 py-2 rounded-lg bg-blue-100 text-blue-900 max-w-2xl">{msg.content}</div>
                </div>
              );
            }
          })}
          {/* Streaming assistant response */}
          {streamedResponse && (
            <div className="flex justify-start">
              <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 max-w-2xl animate-pulse">
                <div className="chat-markdown prose prose-sm max-w-none mb-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamedResponse.replace(/```json([\s\S]*?)```/g, '').replace(/<!--SESSION_SUGGESTIONS_START-->[\s\S]*?<!--SESSION_SUGGESTIONS_END-->/g, '')}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
          {loading && !streamedResponse && <div className="text-gray-400 text-sm">Smart Assistant is thinking...</div>}
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-2 border-t border-gray-200 px-8 py-6 bg-white">
          <input
            className="flex-1 border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50"
            placeholder="Ask me to suggest or book a session..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            disabled={loading || !!streamedResponse}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim() || !!streamedResponse} className="bg-[#002248] hover:bg-[#003366] text-base px-8 py-3">Send</Button>
        </div>
      </div>
      {/* Session Details Dialog */}
      <Dialog open={sessionDialog.open} onOpenChange={open => setSessionDialog({ open, session: open ? sessionDialog.session : null })}>
        <DialogContent className="max-w-lg">
          {sessionDialog.session && (
            <>
              <DialogHeader>
                <DialogTitle>{sessionDialog.session.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                {sessionDialog.session.date && (
                  <div className="text-sm text-gray-600 flex items-center gap-2"><span role="img" aria-label="calendar">📅</span>{formatSessionTime(sessionDialog.session)}</div>
                )}
                {sessionDialog.session.location && (
                  <div className="text-sm text-gray-600 flex items-center gap-2"><span role="img" aria-label="location">📍</span>{sessionDialog.session.location}</div>
                )}
                {sessionDialog.session.mentor && (
                  <div className="text-sm text-gray-600 flex items-center gap-2"><span role="img" aria-label="mentor">🧑‍🏫</span>{sessionDialog.session.mentor.firstName} {sessionDialog.session.mentor.lastName}</div>
                )}
                {sessionDialog.session.group && (
                  <div className="text-sm text-gray-600 flex items-center gap-2"><span role="img" aria-label="group">👥</span>Group {sessionDialog.session.group.groupNumber}</div>
                )}
                <div className="flex gap-2 flex-wrap">
                  {sessionDialog.session.category && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{sessionDialog.session.category}</span>}
                  {sessionDialog.session.isPublic && <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Public</span>}
                </div>
                {sessionDialog.session.description && <div className="text-gray-700 text-sm mt-2 whitespace-pre-line">{sessionDialog.session.description}</div>}
                {sessionDialog.session.bookingError && <div className="text-red-600 text-sm mt-2">{sessionDialog.session.bookingError}</div>}
                {booked && <div className="text-green-600 text-sm font-semibold mt-2">Booked!</div>}
                <Button
                  className="bg-[#002248] hover:bg-[#003366] mt-4"
                  onClick={() => handleBookSession(sessionDialog.session.id)}
                  disabled={booking === sessionDialog.session.id || booked}
                >
                  {booking === sessionDialog.session.id ? 'Booking...' : 'Book this session'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <style jsx global>{`
        .chat-markdown p {
          margin-bottom: 1.25em;
        }
        .chat-markdown ul, .chat-markdown ol {
          margin-bottom: 1.25em;
          padding-left: 1.5em;
        }
        .chat-markdown li {
          margin-bottom: 0.5em;
        }
      `}</style>
    </SidebarLayout>
  );
} 