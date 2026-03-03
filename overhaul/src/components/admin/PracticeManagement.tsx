'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  MusicalNoteIcon,
  SpeakerWaveIcon,
  XMarkIcon,
  CheckIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import type { BackingTrack, StrummingPattern, MusicalKey } from '@/lib/types/practice';

const ADMIN_EMAIL = 'grantmatai@gmail.com';

type SubTab = 'tracks' | 'patterns' | 'keys';

export default function PracticeManagement() {
  const [subTab, setSubTab] = useState<SubTab>('tracks');
  const [tracks, setTracks] = useState<BackingTrack[]>([]);
  const [patterns, setPatterns] = useState<StrummingPattern[]>([]);
  const [keys, setKeys] = useState<MusicalKey[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [showCreateTrack, setShowCreateTrack] = useState(false);
  const [newTrackName, setNewTrackName] = useState('');
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState('');
  const audioInputRef = useRef<HTMLInputElement>(null);

  const [showCreatePattern, setShowCreatePattern] = useState(false);
  const [newPatternName, setNewPatternName] = useState('');
  const [newPatternString, setNewPatternString] = useState('');

  const [showCreateKey, setShowCreateKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newChordI, setNewChordI] = useState('');
  const [newChordIV, setNewChordIV] = useState('');
  const [newChordV, setNewChordV] = useState('');

  // Edit state
  const [editingTrack, setEditingTrack] = useState<BackingTrack | null>(null);
  const [editingPattern, setEditingPattern] = useState<StrummingPattern | null>(null);
  const [editingKey, setEditingKey] = useState<MusicalKey | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadTracks(), loadPatterns(), loadKeys()]);
    setLoading(false);
  };

  const loadTracks = async () => {
    const res = await fetch(`/api/admin/practice/tracks?userEmail=${encodeURIComponent(ADMIN_EMAIL)}`);
    const json = await res.json();
    if (json.success) setTracks(json.data);
  };

  const loadPatterns = async () => {
    const res = await fetch(`/api/admin/practice/patterns?userEmail=${encodeURIComponent(ADMIN_EMAIL)}`);
    const json = await res.json();
    if (json.success) setPatterns(json.data);
  };

  const loadKeys = async () => {
    const res = await fetch(`/api/admin/practice/keys?userEmail=${encodeURIComponent(ADMIN_EMAIL)}`);
    const json = await res.json();
    if (json.success) setKeys(json.data);
  };

  // ---- Audio Upload ----
  const handleAudioUpload = async (file: File) => {
    setUploadingAudio(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userEmail', ADMIN_EMAIL);

      const res = await fetch('/api/admin/practice/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.success) {
        setUploadedAudioUrl(json.data.publicUrl);
      } else {
        alert(`Upload failed: ${json.error}`);
      }
    } catch {
      alert('Upload failed');
    } finally {
      setUploadingAudio(false);
    }
  };

  // ---- CRUD: Tracks ----
  const createTrack = async () => {
    if (!newTrackName || !uploadedAudioUrl) {
      alert('Please provide a name and upload an audio file');
      return;
    }
    const res = await fetch('/api/admin/practice/tracks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTrackName, audio_url: uploadedAudioUrl, userEmail: ADMIN_EMAIL }),
    });
    const json = await res.json();
    if (json.success) {
      setNewTrackName('');
      setUploadedAudioUrl('');
      setShowCreateTrack(false);
      if (audioInputRef.current) audioInputRef.current.value = '';
      loadTracks();
    } else {
      alert(json.error);
    }
  };

  const updateTrack = async () => {
    if (!editingTrack) return;
    const res = await fetch(`/api/admin/practice/tracks/${editingTrack.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editingTrack.name,
        audio_url: editingTrack.audio_url,
        userEmail: ADMIN_EMAIL,
      }),
    });
    const json = await res.json();
    if (json.success) {
      setEditingTrack(null);
      loadTracks();
    } else {
      alert(json.error);
    }
  };

  const deleteTrack = async (id: string) => {
    if (!confirm('Delete this backing track? This will also remove it from all student assignments.')) return;
    const res = await fetch(`/api/admin/practice/tracks/${id}?userEmail=${encodeURIComponent(ADMIN_EMAIL)}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) loadTracks();
    else alert(json.error);
  };

  // ---- CRUD: Patterns ----
  const createPattern = async () => {
    if (!newPatternString) {
      alert('Please provide a pattern string');
      return;
    }
    const res = await fetch('/api/admin/practice/patterns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newPatternName || null, pattern_string: newPatternString, userEmail: ADMIN_EMAIL }),
    });
    const json = await res.json();
    if (json.success) {
      setNewPatternName('');
      setNewPatternString('');
      setShowCreatePattern(false);
      loadPatterns();
    } else {
      alert(json.error);
    }
  };

  const updatePattern = async () => {
    if (!editingPattern) return;
    const res = await fetch(`/api/admin/practice/patterns/${editingPattern.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editingPattern.name,
        pattern_string: editingPattern.pattern_string,
        userEmail: ADMIN_EMAIL,
      }),
    });
    const json = await res.json();
    if (json.success) {
      setEditingPattern(null);
      loadPatterns();
    } else {
      alert(json.error);
    }
  };

  const deletePattern = async (id: string) => {
    if (!confirm('Delete this strumming pattern?')) return;
    const res = await fetch(`/api/admin/practice/patterns/${id}?userEmail=${encodeURIComponent(ADMIN_EMAIL)}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) loadPatterns();
    else alert(json.error);
  };

  // ---- CRUD: Keys ----
  const createKey = async () => {
    if (!newKeyName || !newChordI || !newChordIV || !newChordV) {
      alert('All fields are required');
      return;
    }
    const res = await fetch('/api/admin/practice/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key_name: newKeyName,
        chord_i: newChordI,
        chord_iv: newChordIV,
        chord_v: newChordV,
        userEmail: ADMIN_EMAIL,
      }),
    });
    const json = await res.json();
    if (json.success) {
      setNewKeyName('');
      setNewChordI('');
      setNewChordIV('');
      setNewChordV('');
      setShowCreateKey(false);
      loadKeys();
    } else {
      alert(json.error);
    }
  };

  const updateKey = async () => {
    if (!editingKey) return;
    const res = await fetch(`/api/admin/practice/keys/${editingKey.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key_name: editingKey.key_name,
        chord_i: editingKey.chord_i,
        chord_iv: editingKey.chord_iv,
        chord_v: editingKey.chord_v,
        userEmail: ADMIN_EMAIL,
      }),
    });
    const json = await res.json();
    if (json.success) {
      setEditingKey(null);
      loadKeys();
    } else {
      alert(json.error);
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm('Delete this musical key?')) return;
    const res = await fetch(`/api/admin/practice/keys/${id}?userEmail=${encodeURIComponent(ADMIN_EMAIL)}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) loadKeys();
    else alert(json.error);
  };

  // Arrow buttons for pattern builder
  const appendArrow = (arrow: string) => {
    if (showCreatePattern) {
      setNewPatternString((prev) => (prev ? `${prev} ${arrow}` : arrow));
    } else if (editingPattern) {
      setEditingPattern({
        ...editingPattern,
        pattern_string: editingPattern.pattern_string ? `${editingPattern.pattern_string} ${arrow}` : arrow,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700" />
        <span className="ml-3 text-gray-600">Loading practice data...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Guitar Practice Configuration</h2>
      </div>

      {/* Sub-tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {([
          { id: 'tracks' as SubTab, label: 'Backing Tracks', count: tracks.length },
          { id: 'patterns' as SubTab, label: 'Strumming Patterns', count: patterns.length },
          { id: 'keys' as SubTab, label: 'Musical Keys', count: keys.length },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              subTab === tab.id
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            <span className="ml-1 text-xs opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* ============ BACKING TRACKS ============ */}
      {subTab === 'tracks' && (
        <div>
          {/* Create Button */}
          {!showCreateTrack && (
            <button
              onClick={() => setShowCreateTrack(true)}
              className="mb-4 flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Backing Track
            </button>
          )}

          {/* Create Form */}
          {showCreateTrack && (
            <div className="mb-6 p-4 rounded-lg border-2 border-green-200 bg-green-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">New Backing Track</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Track Name *</label>
                  <input
                    type="text"
                    value={newTrackName}
                    onChange={(e) => setNewTrackName(e.target.value)}
                    placeholder="e.g. Slow Blues Groove"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Audio File *</label>
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept=".mp3,.wav,.ogg,.aac,.m4a"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleAudioUpload(f);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    disabled={uploadingAudio}
                  />
                  {uploadingAudio && <p className="text-sm text-blue-600 mt-1">Uploading...</p>}
                  {uploadedAudioUrl && (
                    <div className="mt-2">
                      <p className="text-sm text-green-600 mb-1">✓ Uploaded</p>
                      <audio src={uploadedAudioUrl} controls className="w-full h-8" />
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button onClick={createTrack} disabled={!newTrackName || !uploadedAudioUrl} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                    <CheckIcon className="h-4 w-4 mr-1" /> Save
                  </button>
                  <button onClick={() => { setShowCreateTrack(false); setNewTrackName(''); setUploadedAudioUrl(''); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tracks List */}
          <div className="space-y-2">
            {tracks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No backing tracks yet. Add one above.</p>
            ) : (
              tracks.map((track) => (
                <div key={track.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                  {editingTrack?.id === track.id ? (
                    <div className="flex-1 mr-3">
                      <input
                        type="text"
                        value={editingTrack.name}
                        onChange={(e) => setEditingTrack({ ...editingTrack, name: e.target.value })}
                        className="w-full p-1 border border-gray-300 rounded text-sm"
                      />
                      <div className="flex space-x-2 mt-2">
                        <button onClick={updateTrack} className="text-green-600 hover:text-green-800 text-sm flex items-center">
                          <CheckIcon className="h-4 w-4 mr-1" /> Save
                        </button>
                        <button onClick={() => setEditingTrack(null)} className="text-gray-500 hover:text-gray-700 text-sm">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center flex-1 min-w-0">
                        <SpeakerWaveIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate">{track.name}</p>
                          <audio src={track.audio_url} controls className="mt-1 h-8 w-full max-w-xs" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-3">
                        <button onClick={() => setEditingTrack({ ...track })} className="text-blue-600 hover:text-blue-800 p-1">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteTrack(track.id)} className="text-red-600 hover:text-red-800 p-1">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============ STRUMMING PATTERNS ============ */}
      {subTab === 'patterns' && (
        <div>
          {!showCreatePattern && (
            <button
              onClick={() => setShowCreatePattern(true)}
              className="mb-4 flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Strumming Pattern
            </button>
          )}

          {showCreatePattern && (
            <div className="mb-6 p-4 rounded-lg border-2 border-green-200 bg-green-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">New Strumming Pattern</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pattern Name (optional)</label>
                  <input
                    type="text"
                    value={newPatternName}
                    onChange={(e) => setNewPatternName(e.target.value)}
                    placeholder="e.g. Basic Down-Up"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pattern String *</label>
                  <div className="flex items-center space-x-2 mb-2">
                    <button onClick={() => appendArrow('↓')} className="px-3 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-100 text-lg font-bold">↓</button>
                    <button onClick={() => appendArrow('↑')} className="px-3 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-100 text-lg font-bold">↑</button>
                    <button onClick={() => appendArrow('x')} className="px-3 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-100 text-lg font-bold">x</button>
                    <button
                      onClick={() => setNewPatternString('')}
                      className="px-3 py-1 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 text-sm text-red-600"
                    >
                      Clear
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newPatternString}
                    onChange={(e) => setNewPatternString(e.target.value)}
                    placeholder="↓ ↓ ↑ ↑ ↓"
                    className="w-full p-2 border border-gray-300 rounded-md font-mono text-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex space-x-2">
                  <button onClick={createPattern} disabled={!newPatternString} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                    <CheckIcon className="h-4 w-4 mr-1" /> Save
                  </button>
                  <button onClick={() => { setShowCreatePattern(false); setNewPatternName(''); setNewPatternString(''); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {patterns.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No strumming patterns yet.</p>
            ) : (
              patterns.map((pattern) => (
                <div key={pattern.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                  {editingPattern?.id === pattern.id ? (
                    <div className="flex-1 mr-3 space-y-2">
                      <input
                        type="text"
                        value={editingPattern.name || ''}
                        onChange={(e) => setEditingPattern({ ...editingPattern, name: e.target.value })}
                        placeholder="Pattern name"
                        className="w-full p-1 border border-gray-300 rounded text-sm"
                      />
                      <div className="flex items-center space-x-2">
                        <button onClick={() => appendArrow('↓')} className="px-2 py-0.5 bg-gray-100 border rounded text-lg">↓</button>
                        <button onClick={() => appendArrow('↑')} className="px-2 py-0.5 bg-gray-100 border rounded text-lg">↑</button>
                        <button onClick={() => appendArrow('x')} className="px-2 py-0.5 bg-gray-100 border rounded text-lg">x</button>
                      </div>
                      <input
                        type="text"
                        value={editingPattern.pattern_string}
                        onChange={(e) => setEditingPattern({ ...editingPattern, pattern_string: e.target.value })}
                        className="w-full p-1 border border-gray-300 rounded text-sm font-mono"
                      />
                      <div className="flex space-x-2">
                        <button onClick={updatePattern} className="text-green-600 hover:text-green-800 text-sm flex items-center">
                          <CheckIcon className="h-4 w-4 mr-1" /> Save
                        </button>
                        <button onClick={() => setEditingPattern(null)} className="text-gray-500 hover:text-gray-700 text-sm">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center flex-1 min-w-0">
                        <MusicalNoteIcon className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0" />
                        <div>
                          {pattern.name && <p className="text-sm text-gray-500">{pattern.name}</p>}
                          <p className="font-mono text-lg text-gray-800">{pattern.pattern_string}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-3">
                        <button onClick={() => setEditingPattern({ ...pattern })} className="text-blue-600 hover:text-blue-800 p-1">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => deletePattern(pattern.id)} className="text-red-600 hover:text-red-800 p-1">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============ MUSICAL KEYS ============ */}
      {subTab === 'keys' && (
        <div>
          {!showCreateKey && (
            <button
              onClick={() => setShowCreateKey(true)}
              className="mb-4 flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Musical Key
            </button>
          )}

          {showCreateKey && (
            <div className="mb-6 p-4 rounded-lg border-2 border-green-200 bg-green-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">New Musical Key</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key Name *</label>
                  <input type="text" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. C" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chord I *</label>
                  <input type="text" value={newChordI} onChange={(e) => setNewChordI(e.target.value)} placeholder="C" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chord IV *</label>
                  <input type="text" value={newChordIV} onChange={(e) => setNewChordIV(e.target.value)} placeholder="F" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chord V *</label>
                  <input type="text" value={newChordV} onChange={(e) => setNewChordV(e.target.value)} placeholder="G" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="col-span-2 flex space-x-2">
                  <button onClick={createKey} disabled={!newKeyName || !newChordI || !newChordIV || !newChordV} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                    <CheckIcon className="h-4 w-4 mr-1" /> Save
                  </button>
                  <button onClick={() => { setShowCreateKey(false); setNewKeyName(''); setNewChordI(''); setNewChordIV(''); setNewChordV(''); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {keys.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No musical keys yet.</p>
            ) : (
              keys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                  {editingKey?.id === key.id ? (
                    <div className="flex-1 mr-3">
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        <input type="text" value={editingKey.key_name} onChange={(e) => setEditingKey({ ...editingKey, key_name: e.target.value })} className="p-1 border border-gray-300 rounded text-sm" placeholder="Key" />
                        <input type="text" value={editingKey.chord_i} onChange={(e) => setEditingKey({ ...editingKey, chord_i: e.target.value })} className="p-1 border border-gray-300 rounded text-sm" placeholder="I" />
                        <input type="text" value={editingKey.chord_iv} onChange={(e) => setEditingKey({ ...editingKey, chord_iv: e.target.value })} className="p-1 border border-gray-300 rounded text-sm" placeholder="IV" />
                        <input type="text" value={editingKey.chord_v} onChange={(e) => setEditingKey({ ...editingKey, chord_v: e.target.value })} className="p-1 border border-gray-300 rounded text-sm" placeholder="V" />
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={updateKey} className="text-green-600 hover:text-green-800 text-sm flex items-center">
                          <CheckIcon className="h-4 w-4 mr-1" /> Save
                        </button>
                        <button onClick={() => setEditingKey(null)} className="text-gray-500 hover:text-gray-700 text-sm">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center flex-1 min-w-0">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-sm mr-3 flex-shrink-0">
                          {key.key_name}
                        </span>
                        <div>
                          <p className="text-sm text-gray-800">
                            <span className="font-medium">I:</span> {key.chord_i} &nbsp;
                            <span className="font-medium">IV:</span> {key.chord_iv} &nbsp;
                            <span className="font-medium">V:</span> {key.chord_v}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-3">
                        <button onClick={() => setEditingKey({ ...key })} className="text-blue-600 hover:text-blue-800 p-1">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteKey(key.id)} className="text-red-600 hover:text-red-800 p-1">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
