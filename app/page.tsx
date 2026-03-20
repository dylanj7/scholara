'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { supabase, Message } from '@/lib/supabase';

type Subject = 'Essay Writing' | 'Mathematics';

export default function StudentChat() {
  const [studentName, setStudentName] = useState('');
  const [subject, setSubject] = useState<Subject>('Essay Writing');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startSession = async () => {
    if (!studentName.trim()) return;

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        student_name: studentName.trim(),
        subject: subject,
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting session:', error);
      return;
    }

    setSessionId(data.id);
    setSessionStarted(true);

    const welcomeMessage = subject === 'Essay Writing'
      ? `Hello ${studentName}! I'm here to help you with essay writing. Whether you need help brainstorming ideas, structuring your essay, improving your thesis statement, or refining your writing style, I'm here to assist. What would you like to work on today?`
      : `Hello ${studentName}! I'm here to help you with mathematics. Whether you're working on algebra, geometry, calculus, or any other math topic, I can guide you through problems step by step. What would you like help with today?`;

    const { data: msgData } = await supabase
      .from('messages')
      .insert({
        session_id: data.id,
        role: 'assistant',
        content: welcomeMessage,
      })
      .select()
      .single();

    if (msgData) {
      setMessages([msgData]);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !sessionId || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    const { data: userMsgData } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        role: 'student',
        content: userMessage,
      })
      .select()
      .single();

    if (userMsgData) {
      setMessages((prev) => [...prev, userMsgData]);
    }

    const aiResponse = generateAIResponse(userMessage, subject);

    const { data: aiMsgData } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: aiResponse,
      })
      .select()
      .single();

    if (aiMsgData) {
      setMessages((prev) => [...prev, aiMsgData]);
    }

    setIsLoading(false);
  };

  const generateAIResponse = (message: string, subj: Subject): string => {
    const lowerMessage = message.toLowerCase();

    if (subj === 'Essay Writing') {
      if (lowerMessage.includes('thesis') || lowerMessage.includes('argument')) {
        return "A strong thesis statement is the foundation of any good essay. It should be specific, arguable, and provide a roadmap for your reader. Try to make it one clear sentence that states your main argument. Would you like to share what you have so far, and I can help you refine it?";
      }
      if (lowerMessage.includes('introduction') || lowerMessage.includes('intro')) {
        return "Your introduction should hook the reader, provide necessary background, and end with your thesis statement. Start with something engaging - a question, a surprising fact, or a relevant anecdote. What topic are you writing about?";
      }
      if (lowerMessage.includes('conclusion')) {
        return "A good conclusion restates your thesis in new words, summarizes your main points, and leaves the reader with something to think about. Avoid introducing new information here. What's the main argument of your essay?";
      }
      if (lowerMessage.includes('help') || lowerMessage.includes('start')) {
        return "I'd be happy to help! Let's start by understanding your assignment. What topic are you writing about, and what type of essay is it (argumentative, expository, narrative, etc.)?";
      }
      return "That's a great question about essay writing. Remember that good writing is about clarity and organization. Each paragraph should have a clear purpose and connect to your thesis. What specific aspect of your essay would you like to work on?";
    } else {
      if (lowerMessage.includes('equation') || lowerMessage.includes('solve')) {
        return "I'd be happy to help you solve that! To work through it step by step, could you share the specific equation or problem you're working on? Remember, in math, we often isolate the variable by performing the same operation on both sides.";
      }
      if (lowerMessage.includes('formula') || lowerMessage.includes('formulas')) {
        return "Formulas are essential tools in mathematics. They help us express relationships between quantities. Which formula are you working with? If you share the topic (like area, quadratic, or trigonometry), I can help explain how to apply it.";
      }
      if (lowerMessage.includes('graph') || lowerMessage.includes('plot')) {
        return "Graphing helps visualize mathematical relationships. The key is understanding what each axis represents and how the equation translates to points on the graph. What type of function or equation are you trying to graph?";
      }
      if (lowerMessage.includes('help') || lowerMessage.includes('start')) {
        return "I'm here to help! Math becomes easier when we break problems into smaller steps. What topic or problem are you working on? Whether it's arithmetic, algebra, geometry, or calculus, we can work through it together.";
      }
      return "Good question! Let's work through this step by step. In mathematics, breaking down problems into smaller parts often makes them more manageable. Could you share the specific problem or concept you're working on?";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-semibold text-[#1B4F8A] text-center mb-12 tracking-tight">
            Scholara
          </h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Subject
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setSubject('Essay Writing')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                    subject === 'Essay Writing'
                      ? 'border-[#1B4F8A] bg-[#1B4F8A] text-white'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Essay Writing
                </button>
                <button
                  onClick={() => setSubject('Mathematics')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                    subject === 'Mathematics'
                      ? 'border-[#1B4F8A] bg-[#1B4F8A] text-white'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Mathematics
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your First Name
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && startSession()}
                placeholder="Enter your first name"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A] outline-none text-gray-900 placeholder-gray-400"
              />
            </div>

            <button
              onClick={startSession}
              disabled={!studentName.trim()}
              className="w-full py-3 px-4 bg-[#1B4F8A] text-white rounded-lg font-medium hover:bg-[#163f6e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Start Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100 py-4 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#1B4F8A] tracking-tight">
            Scholara
          </h1>
          <div className="text-sm text-gray-500">
            {subject} • {studentName}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col max-w-3xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-4">
            {messages.map((message) => (
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
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-gray-100 px-4 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:border-[#1B4F8A] focus:ring-1 focus:ring-[#1B4F8A] outline-none text-gray-900 placeholder-gray-400"
            />
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-4 py-3 bg-[#1B4F8A] text-white rounded-lg hover:bg-[#163f6e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
