'use client';

import { useRouter } from 'next/navigation';

interface ArtifactItem {
  type: string;
  name: string;
  icon: string;
  unlocked: boolean;
  active: boolean;
}

interface ArtifactPair {
  pairName: string;
  items: ArtifactItem[];
}

export default function ProfileClient({
  pairs,
  userId,
}: {
  pairs: ArtifactPair[];
  userId: number;
}) {
  const router = useRouter();

  async function toggleArtifact(artifactType: string) {
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artifact_type: artifactType, action: 'toggle' }),
    });
    router.refresh();
  }

  return (
    <>
      {pairs.map((pair) => (
        <div key={pair.pairName} className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{pair.pairName}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pair.items.map((item) => (
              <div
                key={item.type}
                className={`p-4 rounded-lg border ${
                  item.active
                    ? 'bg-purple-50 border-purple-200'
                    : 'bg-gray-50 border-gray-200'
                } ${!item.unlocked ? 'opacity-40' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                    </div>
                  </div>
                  {item.unlocked ? (
                    <button
                      onClick={() => toggleArtifact(item.type)}
                      className={`px-3 py-1 text-xs rounded-full font-medium ${
                        item.active
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {item.active ? 'Active' : 'Inactive'}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">Locked</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
