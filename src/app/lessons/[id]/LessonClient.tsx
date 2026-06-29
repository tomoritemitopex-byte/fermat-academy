'use client';

import { useState } from 'react';
import { User } from '@/lib/types';

interface Artifact {
  artifact_type: string;
  unlocked: boolean;
  active: boolean;
}

export default function LessonClient({
  lessonId,
  userXP,
  artifacts,
  user,
}: {
  lessonId: number;
  userXP: number;
  artifacts: Artifact[];
  user: User | null;
}) {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!message.trim()) return;

    const userMsg = message.trim();
    setMessage('');
    setChat((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat/drfemi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, lesson_id: lessonId }),
      });
      const data = await res.json();
      setChat((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setChat((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I had trouble connecting.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Active Artifacts */}
      {artifacts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Active Artifacts</h3>
          <div className="space-y-2">
            {artifacts.map((a) => (
              <div key={a.artifact_type} className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="text-green-500">✓</span>
                <span className="capitalize">{a.artifact_type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Chat with Dr. Femi */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b bg-purple-50 rounded-t-xl">
          <h3 className="font-semibold text-purple-900">Ask Dr. Femi</h3>
          <p className="text-sm text-purple-600">AI-powered tutoring assistant</p>
        </div>
        <div className="p-4 h-80 overflow-y-auto space-y-4">
          {chat.length === 0 && (
            <p className="text-gray-400 text-center mt-8">
              Ask a question about this lesson!
            </p>
          )}
          {chat.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-2 rounded-lg text-sm text-gray-500">
                Thinking...
              </div>
            </div>
          )}
        </div>
        {user && (
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask Dr. Femi a question..."
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !message.trim()}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
