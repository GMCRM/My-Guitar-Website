'use client';

import React, { useState, useEffect } from 'react';
import { CheckIcon, MusicalNoteIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import type { BackingTrack, StrummingPattern, MusicalKey } from '@/lib/types/practice';
import { supabase } from '@/lib/supabase';

interface Props {
  studentId: string;
}

export default function StudentPracticeAssignment({ studentId }: Props) {
  const [allTracks, setAllTracks] = useState<BackingTrack[]>([]);
  const [allPatterns, setAllPatterns] = useState<StrummingPattern[]>([]);
  const [allKeys, setAllKeys] = useState<MusicalKey[]>([]);
  const [assignedTrackIds, setAssignedTrackIds] = useState<Set<string>>(new Set());
  const [assignedPatternIds, setAssignedPatternIds] = useState<Set<string>>(new Set());
  const [assignedKeyIds, setAssignedKeyIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (studentId) loadData();
  }, [studentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('Not authenticated');
      }

      const userEmail = encodeURIComponent(user.email);

      const [tracksRes, patternsRes, keysRes, assignRes] = await Promise.all([
        fetch(`/api/admin/practice/tracks?userEmail=${userEmail}`),
        fetch(`/api/admin/practice/patterns?userEmail=${userEmail}`),
        fetch(`/api/admin/practice/keys?userEmail=${userEmail}`),
        fetch(`/api/admin/practice/assign?userEmail=${userEmail}&studentId=${studentId}`),
      ]);

      const [tracksJson, patternsJson, keysJson, assignJson] = await Promise.all([
        tracksRes.json(),
        patternsRes.json(),
        keysRes.json(),
        assignRes.json(),
      ]);

      if (tracksJson.success) setAllTracks(tracksJson.data);
      if (patternsJson.success) setAllPatterns(patternsJson.data);
      if (keysJson.success) setAllKeys(keysJson.data);
      if (assignJson.success) {
        setAssignedTrackIds(new Set(assignJson.data.trackIds));
        setAssignedPatternIds(new Set(assignJson.data.patternIds));
        setAssignedKeyIds(new Set(assignJson.data.keyIds));
      }
    } catch (err) {
      console.error('Failed to load practice assignment data:', err);
    } finally {
      setLoading(false);
      setHasChanges(false);
    }
  };

  const toggleTrack = (id: string) => {
    setAssignedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setHasChanges(true);
  };

  const togglePattern = (id: string) => {
    setAssignedPatternIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setHasChanges(true);
  };

  const toggleKey = (id: string) => {
    setAssignedKeyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setHasChanges(true);
  };

  const saveAssignments = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('Not authenticated');
      }

      const res = await fetch('/api/admin/practice/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          trackIds: Array.from(assignedTrackIds),
          patternIds: Array.from(assignedPatternIds),
          keyIds: Array.from(assignedKeyIds),
          userEmail: user.email,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setHasChanges(false);
      } else {
        alert(`Failed to save: ${json.error}`);
      }
    } catch {
      alert('Failed to save assignments');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-700" />
        <span className="ml-2 text-sm text-gray-500">Loading practice config...</span>
      </div>
    );
  }

  const noContent = allTracks.length === 0 && allPatterns.length === 0 && allKeys.length === 0;

  if (noContent) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm">
          No practice content available. Go to the Practice tab to create backing tracks, patterns, and keys first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Backing Tracks */}
      {allTracks.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <SpeakerWaveIcon className="h-4 w-4 mr-1" />
            Backing Tracks
          </h4>
          <div className="space-y-1">
            {allTracks.map((track) => (
              <label key={track.id} className="flex items-center p-2 rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignedTrackIds.has(track.id)}
                  onChange={() => toggleTrack(track.id)}
                  className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-800">{track.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Strumming Patterns */}
      {allPatterns.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <MusicalNoteIcon className="h-4 w-4 mr-1" />
            Strumming Patterns
          </h4>
          <div className="space-y-1">
            {allPatterns.map((pattern) => (
              <label key={pattern.id} className="flex items-center p-2 rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignedPatternIds.has(pattern.id)}
                  onChange={() => togglePattern(pattern.id)}
                  className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-800 font-mono">
                  {pattern.pattern_string}
                  {pattern.name && <span className="font-sans text-gray-500 ml-2">({pattern.name})</span>}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Musical Keys */}
      {allKeys.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Musical Keys</h4>
          <div className="flex flex-wrap gap-2">
            {allKeys.map((key) => (
              <button
                key={key.id}
                onClick={() => toggleKey(key.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  assignedKeyIds.has(key.id)
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                }`}
              >
                {key.key_name}
                {assignedKeyIds.has(key.id) && <CheckIcon className="h-3 w-3 inline ml-1" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="pt-2">
        <button
          onClick={saveAssignments}
          disabled={!hasChanges || saving}
          className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center ${
            hasChanges
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4 mr-1" />
              {hasChanges ? 'Save Practice Assignments' : 'No Changes'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
