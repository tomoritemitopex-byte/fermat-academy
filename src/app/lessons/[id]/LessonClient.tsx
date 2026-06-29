'use client';

import { User } from '@/lib/types';
import DrFemiBubble from '@/components/DrFemiBubble';

interface Artifact {
  artifact_type: string;
  unlocked: boolean;
  active: boolean;
}

export default function LessonClient({
  lessonId,
  artifacts,
}: {
  lessonId: number;
  userXP?: number;
  artifacts: Artifact[];
  user?: User | null;
}) {
  return (
    <>
      {/* Active Artifacts */}
      {artifacts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
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

      {/* Floating Dr. Femi chat bubble */}
      <DrFemiBubble lessonId={lessonId} />
    </>
  );
}
