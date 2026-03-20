'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Image as ImageIcon, ChevronLeft, RefreshCw } from 'lucide-react';
import { supabase, Message } from '@/lib/supabase';

type Subject = 'Essay Writing' | 'Mathematics';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

const QUOTES = [
  { text: 'The mind is not a vessel to be filled, but a fire to be kindled.', author: 'Plutarch' },
  { text: 'Tell me and I forget. Teach me and I remember. Involve me and I learn.', author: 'Benjamin Franklin' },
  { text: 'Education is not the filling of a pail, but the lighting of a fire.', author: 'W.B. Yeats' },
  { text: 'The art of teaching is the art of assisting discovery.', author: 'Mark Van Doren' },
  { text: 'Struggle is not the enemy of learning. It is the engine of it.', author: 'Scholara' },
  { text: 'The more that you read, the more things you will know.', author: 'Dr. Seuss' },
  { text: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
  { text: "You don't understand anything until you learn it more than one way.", author: 'Marvin Minsky' },
  { text: 'Curiosity is the wick in the candle of learning.', author: 'William A. Ward' },
  { text: 'Every student can learn. Just not on the same day, or in the same way.', author: 'George Evans' },
];

function RotatingQuote() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % QUOTES.length);
        setVisible(true);
      }, 600);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const quote = QUOTES[index];
  return (
    <div
      className="text-center transition-opacity duration-600"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 600ms ease' }}
    >
      <p className="text-xl font-medium italic leading-snug mb-2" style={{ color: '#993C1D', opacity: 0.75 }}>
        "{quote.text}"
      </p>
      <p className="text-sm" style={{ color: '#D85A30', opacity: 0.55 }}>— {quote.author}</p>
    </div>
  );
}

export default function StudentChat() {
  const [studentName, setStudentName] = useState('');
  const [subject, setSubject] = useState<Subject>('Essay Writing');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);
    };
  }, [pendingImage]);

  const startSession = async () => {
    if (!studentName.trim()) return;

    const { data, error } = await supabase
      .from('sessions')
      .insert({ student_name: studentName.trim(), subject })
      .select()
      .single();

    if (error) {
      console.error('Error starting session:', error);
      return;
    }

    setSessionId(data.id);
    setSessionStartTime(new Date());
    setSessionStarted(true);

    const welcomeMessage = subject === 'Essay Writing'
      ? `Hello ${studentName}! I'm here to help you with essay writing. Whether you need help brainstorming ideas, structuring your essay, improving your thesis statement, or refining your writing style, I'm here to assist. What would you like to work on today?`
      : `Hello ${studentName}! I'm here to help you with mathematics. You can type your question or upload a photo of a problem using the attachment button. What would you like help with today?`;

    const { data: msgData } = await supabase
      .from('messages')
      .insert({ session_id: data.id, role: 'assistant', content: welcomeMessage })
      .select()
      .single();

    if (msgData) setMessages([msgData]);
  };

  const calculateEngagementScore = (msgs: Message[]): number => {
    const studentMsgs = msgs.filter((m) => m.role === 'student');
    if (studentMsgs.length === 0) return 1;

    const SHORTCUT_PHRASES = [
      'just tell me',
      'give me the answer',
      'do it for me',
      'just write',
    ];

    let score = 5;

    const count = studentMsgs.length;
    if (count >= 10) score += 2;
    else if (count >= 6) score += 1.5;
    else if (count >= 3) score += 1;
    else if (count === 1) score -= 1;

    const avgLen = studentMsgs.reduce((sum, m) => sum + m.content.length, 0) / count;
    if (avgLen >= 150) score += 2;
    else if (avgLen >= 80) score += 1.5;
    else if (avgLen >= 40) score += 1;
    else if (avgLen < 15) score -= 1;

    const shortcutCount = studentMsgs.filter((m) =>
      SHORTCUT_PHRASES.some((phrase) => m.content.toLowerCase().includes(phrase))
    ).length;
    score -= shortcutCount * 1.5;

    return Math.min(10, Math.max(1, Math.round(score)));
  };

  const endSession = async () => {
    if (sessionId && sessionStartTime) {
      const duration = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
      const messagesJson = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        image_url: msg.image_url ?? null,
        created_at: msg.created_at,
      }));

      const engagement_score = calculateEngagementScore(messages);

      await supabase
        .from('sessions')
        .update({
          ended_at: new Date().toISOString(),
          duration,
          messages: messagesJson,
          engagement_score,
        })
        .eq('id', sessionId);
    }

    setSessionStarted(false);
    setSessionId(null);
    setSessionStartTime(null);
    setMessages([]);
    setInputValue('');
    setPendingImage(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const previewUrl = URL.createObjectURL(file);
    setPendingImage({ file, previewUrl });
    e.target.value = '';
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from('math-images')
      .upload(fileName, file, { contentType: file.type });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    const { data } = supabase.storage.from('math-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const sendMessage = async () => {
    if ((!inputValue.trim() && !pendingImage) || !sessionId || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    let imageUrl: string | null = null;

    if (pendingImage) {
      setIsUploading(true);
      imageUrl = await uploadImage(pendingImage.file);
      URL.revokeObjectURL(pendingImage.previewUrl);
      setPendingImage(null);
      setIsUploading(false);
    }

    const { data: userMsgData } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        role: 'student',
        content: userMessage || (imageUrl ? 'Uploaded an image' : ''),
        image_url: imageUrl,
      })
      .select()
      .single();

    if (userMsgData) setMessages((prev) => [...prev, userMsgData]);

    try {
      const chatHistory: ChatMessage[] = messages.map((msg) => ({
        role: msg.role === 'student' ? 'user' : 'assistant',
        content: msg.content,
        imageUrl: msg.image_url ?? undefined,
      }));
      chatHistory.push({
        role: 'user',
        content: userMessage || 'I uploaded an image of a math problem.',
        imageUrl: imageUrl ?? undefined,
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory, subject, studentName }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      const { data: aiMsgData } = await supabase
        .from('messages')
        .insert({ session_id: sessionId, role: 'assistant', content: data.message })
        .select()
        .single();

      if (aiMsgData) {
        const updatedMessages = [...messages];
        if (userMsgData) updatedMessages.push(userMsgData);
        updatedMessages.push(aiMsgData);
        setMessages((prev) => [...prev, aiMsgData]);

        const engagement_score = calculateEngagementScore(updatedMessages);
        await supabase
          .from('sessions')
          .update({ engagement_score })
          .eq('id', sessionId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const { data: errorMsgData } = await supabase
        .from('messages')
        .insert({
          session_id: sessionId,
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        })
        .select()
        .single();

      if (errorMsgData) setMessages((prev) => [...prev, errorMsgData]);
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!sessionStarted) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FDF6F0' }}>
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <div className="text-center mb-6">
                <div
                  className="inline-block mb-6 px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase"
                  style={{ backgroundColor: '#FAECE7', color: '#993C1D' }}
                >
                  AI Tutoring
                </div>
                <RotatingQuote />
              </div>
            </div>

            <div
              className="rounded-2xl p-6 space-y-5"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #F5C4B3' }}
            >
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#712B13' }}>
                  Select Subject
                </label>
                <div className="flex gap-2">
                  {(['Essay Writing', 'Mathematics'] as Subject[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSubject(s)}
                      className="flex-1 py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all"
                      style={
                        subject === s
                          ? { borderColor: '#D85A30', backgroundColor: '#D85A30', color: '#FFFFFF' }
                          : { borderColor: '#F5C4B3', backgroundColor: '#FAECE7', color: '#993C1D' }
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#712B13' }}>
                  Your First Name
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && startSession()}
                  placeholder="Enter your first name"
                  className="w-full px-4 py-3 rounded-lg outline-none text-sm transition-colors"
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

              <button
                onClick={startSession}
                disabled={!studentName.trim()}
                className="w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#D85A30', color: '#FFFFFF' }}
                onMouseOver={(e) => { if (studentName.trim()) (e.target as HTMLButtonElement).style.backgroundColor = '#993C1D'; }}
                onMouseOut={(e) => { (e.target as HTMLButtonElement).style.backgroundColor = '#D85A30'; }}
              >
                Start Session
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 57px)', backgroundColor: '#FDF6F0' }}>
      <div className="py-2 px-4" style={{ borderBottom: '1px solid #F5C4B3', backgroundColor: '#FFFFFF' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={endSession}
              className="flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: '#F0997B' }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#712B13')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#F0997B')}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <span style={{ color: '#F5C4B3' }}>|</span>
            <span className="text-sm font-medium" style={{ color: '#712B13' }}>{studentName}</span>
            <span className="text-xs" style={{ color: '#D85A30', opacity: 0.7 }}>&mdash; {subject}</span>
          </div>
          <div className="flex items-center gap-2">
            {subject === 'Mathematics' && (
              <span
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: '#FAECE7', color: '#993C1D', border: '1px solid #F5C4B3' }}
              >
                <ImageIcon className="w-3 h-3" />
                Image upload on
              </span>
            )}
            <button
              onClick={endSession}
              title="New session"
              className="flex items-center gap-1.5 text-xs transition-colors px-2 py-1 rounded-md"
              style={{ color: '#F0997B' }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#D85A30';
                e.currentTarget.style.backgroundColor = '#FAECE7';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#F0997B';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              New session
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden flex flex-col max-w-3xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
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
                  {message.image_url && (
                    <img
                      src={message.image_url}
                      alt="Uploaded math problem"
                      className="mb-2 rounded-lg max-w-full max-h-64 object-contain bg-white"
                    />
                  )}
                  {message.content && message.content !== 'Uploaded an image' && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="px-4 py-3 rounded-2xl"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #F5C4B3',
                    borderBottomLeftRadius: '6px',
                  }}
                >
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#F0997B' }} />
                    <div className="w-2 h-2 rounded-full animate-pulse delay-75" style={{ backgroundColor: '#F0997B' }} />
                    <div className="w-2 h-2 rounded-full animate-pulse delay-150" style={{ backgroundColor: '#F0997B' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="px-4 py-4" style={{ borderTop: '1px solid #F5C4B3' }}>
          {pendingImage && (
            <div className="mb-3 flex items-start gap-2">
              <div className="relative inline-block">
                <img
                  src={pendingImage.previewUrl}
                  alt="Pending upload"
                  className="h-20 w-20 object-cover rounded-lg"
                  style={{ border: '1px solid #F5C4B3' }}
                />
                <button
                  onClick={() => {
                    URL.revokeObjectURL(pendingImage.previewUrl);
                    setPendingImage(null);
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#712B13', color: '#FAECE7' }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <span className="text-xs mt-1" style={{ color: '#D85A30' }}>Image ready to send</span>
            </div>
          )}

          <div className="flex gap-2">
            {subject === 'Mathematics' && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isUploading}
                  className="px-3 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: '#F0997B', border: '1px solid #F5C4B3', backgroundColor: '#FFFFFF' }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = '#D85A30';
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FAECE7';
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = '#F0997B';
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FFFFFF';
                  }}
                  title="Upload image"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </>
            )}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={pendingImage ? 'Add a message (optional)...' : 'Type your message...'}
              className="flex-1 px-4 py-3 rounded-lg outline-none text-sm"
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
            <button
              onClick={sendMessage}
              disabled={(!inputValue.trim() && !pendingImage) || isLoading || isUploading}
              className="px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#D85A30', color: '#FFFFFF' }}
              onMouseOver={(e) => {
                if (!((e.currentTarget as HTMLButtonElement).disabled))
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#993C1D';
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#D85A30';
              }}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
