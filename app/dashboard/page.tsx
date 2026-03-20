'use client';

import { useState } from 'react';
import { X, Eye, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface MessageEntry {
  role: 'student' | 'assistant';
  content: string;
  image_url?: string | null;
  created_at?: string;
}

interface Session {
  id: string;
  student_name: string;
  subject: string;
  started_at: string;
  ended_at: string | null;
  duration: number | null;
  messages: MessageEntry[] | null;
  created_at: string;
  engagement_score: number | null;
}

const AVATAR_STYLES = [
  { bg: '#FAECE7', text: '#993C1D' },
  { bg: '#FAEEDA', text: '#854F0B' },
  { bg: '#FDF6F0', text: '#712B13' },
];

function EngagementBadge({ score }: { score: number | null }) {
  if (score === null) return <span style={{ color: '#F0997B' }}>—</span>;
  const isGreen = score >= 7;
  const isYellow = score >= 4 && score <= 6;
  const style = isGreen
    ? { backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0' }
    : isYellow
    ? { backgroundColor: '#FEF9C3', color: '#854D0E', border: '1px solid #FEF08A' }
    : { backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' };
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-6 rounded-full text-xs font-semibold"
      style={style}
    >
      {score}
    </span>
  );
}

export default function TeacherDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'scholara2025') {
      setIsAuthenticated(true);
      setError('');
      loadSessions();
    } else {
      setError('Incorrect password');
    }
  };

  const loadSessions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('sessions')
      .select('*, messages(*)')
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error loading sessions:', error);
    } else {
      const enriched = (data || []).map((s: any) => ({
        ...s,
        messages: s.messages && s.messages.length > 0
          ? s.messages.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          : (s.messages_json || null),
      }));
      setSessions(enriched);
    }
    setIsLoading(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDuration = (session: Session) => {
    if (session.duration != null) {
      const mins = Math.floor(session.duration / 60);
      const secs = session.duration % 60;
      if (mins === 0) return `${secs}s`;
      if (secs === 0) return `${mins} min${mins !== 1 ? 's' : ''}`;
      return `${mins}m ${secs}s`;
    }
    if (session.ended_at) {
      const diff = Math.floor(
        (new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 1000 / 60
      );
      if (diff < 1) return '< 1 min';
      return `${diff} min${diff !== 1 ? 's' : ''}`;
    }
    return '—';
  };

  const viewSession = async (session: Session) => {
    setSelectedSession(session);
    setIsLoadingMessages(true);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    if (data && data.length > 0) {
      setSelectedSession({ ...session, messages: data });
    }
    setIsLoadingMessages(false);
  };

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ backgroundColor: '#FDF6F0' }}
      >
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <p className="text-sm" style={{ color: '#993C1D' }}>Enter the teacher password to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#712B13' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#F0997B' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter dashboard password"
                  className="w-full pl-10 pr-4 py-3 rounded-lg outline-none text-sm"
                  style={{
                    border: '1px solid #F5C4B3',
                    backgroundColor: '#FFFFFF',
                    color: '#712B13',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#D85A30';
                    e.target.style.boxShadow = '0 0 0 1px #D85A30';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#F5C4B3';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              {error && (
                <p className="mt-2 text-sm" style={{ color: '#D85A30' }}>{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: '#D85A30', color: '#FFFFFF' }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#993C1D')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#D85A30')}
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDF6F0' }}>
      <div
        className="py-3 px-4 md:px-6 flex items-center justify-between max-w-6xl mx-auto"
        style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #F5C4B3' }}
      >
        <p className="text-sm font-medium" style={{ color: '#712B13' }}>Teacher Dashboard</p>
        <button
          onClick={() => setIsAuthenticated(false)}
          className="text-sm transition-colors"
          style={{ color: '#F0997B' }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#712B13')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#F0997B')}
        >
          Sign Out
        </button>
      </div>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #F5C4B3' }}
        >
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #F5C4B3' }}>
            <h2 className="text-lg font-medium" style={{ color: '#712B13' }}>Session History</h2>
            <p className="text-sm mt-1" style={{ color: '#993C1D', opacity: 0.7 }}>
              View all student tutoring sessions
            </p>
          </div>

          {isLoading ? (
            <div className="px-6 py-12 text-center text-sm" style={{ color: '#F0997B' }}>
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm" style={{ color: '#F0997B' }}>
              No sessions yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: '#FDF6F0', borderBottom: '1px solid #F5C4B3' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#993C1D' }}>
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#993C1D' }}>
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#993C1D' }}>
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#993C1D' }}>
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#993C1D' }}>
                      Engagement
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#993C1D' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session, idx) => {
                    const avatarStyle = AVATAR_STYLES[idx % AVATAR_STYLES.length];
                    return (
                      <tr
                        key={session.id}
                        style={{ borderBottom: '1px solid #F5C4B3' }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#FDF6F0')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                              style={{ backgroundColor: avatarStyle.bg, color: avatarStyle.text }}
                            >
                              {session.student_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium" style={{ color: '#712B13' }}>
                              {session.student_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#993C1D' }}>
                          {session.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span style={{ color: '#712B13' }}>{formatDate(session.started_at)}</span>
                          <span className="ml-2" style={{ color: '#F0997B' }}>
                            {formatTime(session.started_at)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#993C1D' }}>
                          {formatDuration(session)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <EngagementBadge score={session.engagement_score} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => viewSession(session)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
                            style={{ color: '#D85A30' }}
                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#FAECE7')}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {selectedSession && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div
            className="w-full max-w-2xl max-h-[80vh] flex flex-col rounded-xl"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #F5C4B3' }}
          >
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #F5C4B3' }}>
              <div>
                <h3 className="text-lg font-medium" style={{ color: '#712B13' }}>
                  Session Transcript
                </h3>
                <p className="text-sm mt-0.5" style={{ color: '#993C1D', opacity: 0.8 }}>
                  {selectedSession.student_name} — {selectedSession.subject}
                  {selectedSession.duration != null && (
                    <span className="ml-2" style={{ color: '#F0997B' }}>· {formatDuration(selectedSession)}</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: '#F0997B' }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#712B13';
                  e.currentTarget.style.backgroundColor = '#FAECE7';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#F0997B';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4" style={{ backgroundColor: '#FDF6F0' }}>
              {isLoadingMessages ? (
                <div className="text-center text-sm py-8" style={{ color: '#F0997B' }}>
                  Loading messages...
                </div>
              ) : !selectedSession.messages || selectedSession.messages.length === 0 ? (
                <div className="text-center text-sm py-8" style={{ color: '#F0997B' }}>
                  No messages recorded for this session.
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedSession.messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'student' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className="max-w-[80%] px-4 py-3 rounded-2xl"
                        style={
                          message.role === 'student'
                            ? {
                                backgroundColor: '#993C1D',
                                color: '#FAECE7',
                                borderBottomRightRadius: '6px',
                              }
                            : {
                                backgroundColor: '#FFFFFF',
                                color: '#712B13',
                                border: '1px solid #F5C4B3',
                                borderBottomLeftRadius: '6px',
                              }
                        }
                      >
                        <p
                          className="text-xs font-medium mb-1 capitalize"
                          style={{ opacity: 0.6 }}
                        >
                          {message.role === 'student' ? 'Student' : 'Sage'}
                        </p>
                        {message.image_url && (
                          <img
                            src={message.image_url}
                            alt="Uploaded image"
                            className="mb-2 rounded-lg max-w-full max-h-48 object-contain bg-white"
                          />
                        )}
                        {message.content && message.content !== 'Uploaded an image' && (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                        )}
                        {message.created_at && (
                          <p className="text-xs mt-2" style={{ opacity: 0.5 }}>
                            {formatTime(message.created_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4" style={{ borderTop: '1px solid #F5C4B3' }}>
              <button
                onClick={() => setSelectedSession(null)}
                className="w-full py-2.5 px-4 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#FAECE7', color: '#712B13' }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F5C4B3')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FAECE7')}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
