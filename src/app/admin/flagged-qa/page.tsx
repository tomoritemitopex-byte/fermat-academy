'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface FlaggedQA {
  id: number;
  user_id: number | null;
  lesson_id: number;
  question: string;
  answer: string;
  resolved: boolean;
}

export default function FlaggedQAPage() {
  const router = useRouter();
  const [items, setItems] = useState<FlaggedQA[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/flagged-qa')
      .then((r) => r.json())
      .then((data) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  async function resolve(id: number) {
    await fetch('/api/admin/flagged-qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Flagged Q&A</h1>
      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="mb-3">
                <p className="text-sm text-gray-500 mb-1">Question</p>
                <p className="text-gray-900">{item.question}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">AI Answer</p>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">{item.answer}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Lesson #{item.lesson_id}
                  {item.user_id && ` · User #${item.user_id}`}
                </span>
                <button
                  onClick={() => resolve(item.id)}
                  className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700"
                >
                  Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border">
          <p className="text-lg">No flagged Q&A to review.</p>
        </div>
      )}
    </div>
  );
}
