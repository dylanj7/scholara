'use client';

import { useState, useEffect } from 'react';
import { X, Eye, Lock } from 'lucide-react';
import { supabase, Session, Message } from '@/lib/supabase';

interface SessionWithMessages extends Session {
  messages?: Message[];
}

export default function TeacherDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState<SessionWithMessages[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionWithMessages | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      .select('*')
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error loading sessions:', error);
    } else {
      setSessions(data || []);
    }
    setIsLoading(false);
  };

  const viewSession = async (session: SessionWithMessages) => {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setSelectedSession({ ...session, messages: messages || [] });
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

  const calculateDuration = (session: Session) => {
    const start = new Date(session.started_at);
    const end = session.ended_at ? new Date(session.ended_at) : new Date();
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000 / 60);
    if (diff < 1) return '< 1 min';
    if (diff === 1) return '1 min';
    return `${diff} mins`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-[#1B4F8A] mb-2 tracking-tight">
              Scholara
            </h1>
            <p className="text-gray-500 text-sm">Teacher Dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter dashboard password"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A] outline-none text-gray-900 placeholder-gray-400"
                />
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#1B4F8A] text-white rounded-lg font-medium hover:bg-[#163f6e] transition-colors"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-4 px-4 md:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#1B4F8A] tracking-tight">
              Scholara
            </h1>
            <p className="text-sm text-gray-500">Teacher Dashboard</p>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Session History</h2>
            <p className="text-sm text-gray-500 mt-1">
              View all student tutoring sessions
            </p>
          </div>

          {isLoading ? (
            <div className="px-6 py-12 text-center text-gray-500">
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No sessions yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {session.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {session.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span>{formatDate(session.started_at)}</span>
                        <span className="text-gray-400 ml-2">
                          {formatTime(session.started_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {calculateDuration(session)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => viewSession(session)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#1B4F8A] hover:bg-[#1B4F8A]/5 rounded-md transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Session Transcript
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {selectedSession.student_name} - {selectedSession.subject}
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {selectedSession.messages?.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'student' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        message.role === 'student'
                          ? 'bg-[#1B4F8A] text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-800 rounded-bl-md'
                      }`}
                    >
                      {message.image_url && (
                        <img
                          src={message.image_url}
                          alt="Uploaded math problem"
                          className="mb-2 rounded-lg max-w-full max-h-48 object-contain bg-white"
                        />
                      )}
                      {message.content && message.content !== 'Uploaded an image' && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                      <p className={`text-xs mt-2 ${
                        message.role === 'student' ? 'text-white/70' : 'text-gray-400'
                      }`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedSession(null)}
                className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
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
