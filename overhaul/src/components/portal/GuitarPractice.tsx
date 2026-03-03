'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  SpeakerWaveIcon,
  MusicalNoteIcon,
  PlayIcon,
  StopIcon,
} from '@heroicons/react/24/outline';
import type { BackingTrack, StrummingPattern, MusicalKey } from '@/lib/types/practice';

interface Props {
  userId: string;
}

export default function GuitarPractice({ userId }: Props) {
  const [tracks, setTracks] = useState<BackingTrack[]>([]);
  const [patterns, setPatterns] = useState<StrummingPattern[]>([]);
  const [keys, setKeys] = useState<MusicalKey[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTrack, setSelectedTrack] = useState<BackingTrack | null>(null);
  const [selectedKey, setSelectedKey] = useState<MusicalKey | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<StrummingPattern | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    loadPracticeData();
  }, [userId]);

  const loadPracticeData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/practice?studentId=${userId}`);
      const json = await res.json();
      if (json.success) {
        setTracks(json.data.tracks);
        setPatterns(json.data.patterns);
        setKeys(json.data.keys);
      }
    } catch (err) {
      console.error('Failed to load practice data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrack = (track: BackingTrack) => {
    setSelectedTrack(track);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = track.audio_url;
      audioRef.current.load();
    }
  };

  const handleStartPractice = () => {
    if (audioRef.current && selectedTrack) {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleStopPractice = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center py-16"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        <span className="ml-3 text-gray-600">Loading practice tools...</span>
      </motion.div>
    );
  }

  const hasNoContent = tracks.length === 0 && patterns.length === 0 && keys.length === 0;

  if (hasNoContent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden"
      >
        <div className="text-center py-12 p-8">
          <MusicalNoteIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No practice content assigned yet.</p>
          <p className="text-gray-500 mt-2">Your teacher will assign backing tracks, strumming patterns, and keys for you to practice.</p>
        </div>
      </motion.div>
    );
  }

  const allSelected = selectedTrack && selectedKey && selectedPattern;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-6"
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} loop preload="none" onEnded={() => setIsPlaying(false)} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ======= SELECTION PANEL (compact sidebar) ======= */}
        <div className="lg:col-span-1 space-y-4">
          {/* Backing Tracks */}
          {tracks.length > 0 && (
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl shadow-lg p-4">
              <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
                <SpeakerWaveIcon className="h-4 w-4 mr-1.5 text-green-600" />
                Backing Track
              </h3>
              <div className="space-y-1.5">
                {tracks.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => handleSelectTrack(track)}
                    className={`w-full text-left px-3 py-2 rounded-lg border-2 transition-all duration-200 text-sm ${
                      selectedTrack?.id === track.id
                        ? 'bg-green-600 text-white border-green-600 shadow-md'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    {track.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Musical Keys */}
          {keys.length > 0 && (
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl shadow-lg p-4">
              <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
                <MusicalNoteIcon className="h-4 w-4 mr-1.5 text-amber-600" />
                Key Selection
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {keys.map((key) => (
                  <button
                    key={key.id}
                    onClick={() => setSelectedKey(key)}
                    className={`px-3 py-2 rounded-lg font-medium border-2 transition-all duration-200 text-sm ${
                      selectedKey?.id === key.id
                        ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-amber-300 hover:bg-amber-50'
                    }`}
                  >
                    Key of {key.key_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Strumming Patterns */}
          {patterns.length > 0 && (
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl shadow-lg p-4">
              <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center">
                <MusicalNoteIcon className="h-4 w-4 mr-1.5 text-purple-600" />
                Strumming Pattern
              </h3>
              <div className="space-y-1.5">
                {patterns.map((pattern) => (
                  <button
                    key={pattern.id}
                    onClick={() => setSelectedPattern(pattern)}
                    className={`w-full px-3 py-2.5 rounded-lg border-2 font-mono text-base text-center transition-all duration-200 ${
                      selectedPattern?.id === pattern.id
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    <span className="tracking-wider">{pattern.pattern_string}</span>
                    {pattern.name && (
                      <span className={`block text-xs font-sans mt-0.5 ${
                        selectedPattern?.id === pattern.id ? 'text-purple-200' : 'text-gray-500'
                      }`}>
                        {pattern.name}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ======= PRACTICE DISPLAY PANEL (main focus) ======= */}
        <div className="lg:col-span-3">
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-xl p-8 sticky top-8 min-h-[500px]">
            <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">Practice Display</h3>

            {/* Selected Info */}
            <div className="space-y-6 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-base text-gray-500">Selected Track:</span>
                <span className="text-xl font-bold text-gray-800">
                  {selectedTrack ? selectedTrack.name : <span className="text-gray-400">None</span>}
                </span>
              </div>
              <div className="border-t border-gray-100" />

              <div className="flex justify-between items-center">
                <span className="text-base text-gray-500">Selected Key:</span>
                <span className="text-xl font-bold text-gray-800">
                  {selectedKey ? `Key of ${selectedKey.key_name}` : <span className="text-gray-400">None</span>}
                </span>
              </div>
              <div className="border-t border-gray-100" />

              {/* Chord Progression */}
              <div>
                <span className="text-base text-gray-500">Chord Progression (I – IV – V):</span>
                {selectedKey ? (
                  <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-400 uppercase tracking-wide">I</span>
                      <span className="text-4xl font-bold text-green-700">{selectedKey.chord_i}</span>
                    </div>
                    <span className="text-gray-300 text-3xl">–</span>
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-400 uppercase tracking-wide">IV</span>
                      <span className="text-4xl font-bold text-amber-600">{selectedKey.chord_iv}</span>
                    </div>
                    <span className="text-gray-300 text-3xl">–</span>
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-400 uppercase tracking-wide">V</span>
                      <span className="text-4xl font-bold text-purple-600">{selectedKey.chord_v}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xl font-bold text-gray-800 text-center mt-3">—</p>
                )}
              </div>
              <div className="border-t border-gray-100" />

              {/* Strumming Pattern Display */}
              <div>
                <span className="text-base text-gray-500">Strumming Pattern:</span>
                {selectedPattern ? (
                  <p className="font-mono text-3xl text-center mt-3 tracking-widest text-gray-800">
                    {selectedPattern.pattern_string}
                  </p>
                ) : (
                  <p className="text-xl font-bold text-gray-800 text-center mt-3">—</p>
                )}
              </div>
            </div>

            {/* Start / Stop Buttons */}
            <div className="flex gap-4 mt-5">
              <button
                onClick={handleStartPractice}
                disabled={!selectedTrack || isPlaying}
                className={`flex-1 flex items-center justify-center px-6 py-4 rounded-lg font-semibold text-base transition-all duration-200 ${
                  !selectedTrack || isPlaying
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
                }`}
              >
                <PlayIcon className="h-6 w-6 mr-2" />
                Start Practice
              </button>
              <button
                onClick={handleStopPractice}
                disabled={!isPlaying}
                className={`flex-1 flex items-center justify-center px-6 py-4 rounded-lg font-semibold text-base transition-all duration-200 ${
                  !isPlaying
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg'
                }`}
              >
                <StopIcon className="h-6 w-6 mr-2" />
                Stop
              </button>
            </div>

            {/* Helper text */}
            {!allSelected && (
              <p className="text-xs text-gray-400 text-center mt-4">
                Select a track, key, and strumming pattern to begin practicing.
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
