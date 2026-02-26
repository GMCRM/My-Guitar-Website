'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  DocumentArrowDownIcon,
  CheckIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  EyeIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlayIcon,
  MusicalNoteIcon,
  SpeakerWaveIcon,
  HeartIcon,
  ShareIcon,
  ArrowTopRightOnSquareIcon,
  ForwardIcon,
  BackwardIcon,
  FireIcon,
  MicrophoneIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import Navigation from '@/components/Navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

// YouTube API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// Guitar Tuner constants
const GUITAR_STRINGS = [
  { name: "E2", freq: 82.41 },
  { name: "A2", freq: 110.0 },
  { name: "D3", freq: 146.83 },
  { name: "G3", freq: 196.0 },
  { name: "B3", freq: 246.94 },
  { name: "E4", freq: 329.63 },
];

const StudentPortal = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'materials' | 'videos' | 'schedule' | 'habits' | 'tuner'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('studentPortalActiveTab');
      if (saved && ['materials', 'videos', 'schedule', 'habits', 'tuner'].includes(saved)) {
        return saved as 'materials' | 'videos' | 'schedule' | 'habits' | 'tuner';
      }
    }
    return 'materials';
  });
  const [currentMaterialIndex, setCurrentMaterialIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [materialUrls, setMaterialUrls] = useState<{[key: string]: string}>({});
  const [habitDates, setHabitDates] = useState<Set<string>>(new Set());
  const [habitViewYear, setHabitViewYear] = useState(new Date().getFullYear());
  const [habitViewMonth, setHabitViewMonth] = useState(new Date().getMonth());
  const [habitLoading, setHabitLoading] = useState(false);

  // Guitar Tuner state
  const [tunerRunning, setTunerRunning] = useState(false);
  const [tunerStatus, setTunerStatus] = useState('Click Start to begin tuning');
  const [tunerSelectedTarget, setTunerSelectedTarget] = useState<string>('AUTO');
  const [tunerFrequency, setTunerFrequency] = useState<number | null>(null);
  const [tunerNote, setTunerNote] = useState<string>('—');
  const [tunerCents, setTunerCents] = useState<number>(0);
  const [tunerConfidence, setTunerConfidence] = useState<number>(0);
  const [tunerIsInTune, setTunerIsInTune] = useState(false);
  const [tunerIsSettling, setTunerIsSettling] = useState(false);
  const [tunerSupported, setTunerSupported] = useState(true);
  
  // Guitar Tuner refs (for audio objects that shouldn't trigger re-renders)
  const tunerAudioContextRef = useRef<AudioContext | null>(null);
  const tunerAnalyserRef = useRef<AnalyserNode | null>(null);
  const tunerMediaStreamRef = useRef<MediaStream | null>(null);
  const tunerTimeDataRef = useRef<Float32Array | null>(null);
  const tunerRafIdRef = useRef<number | null>(null);
  const tunerRunningRef = useRef<boolean>(false);
  const tunerSmoothedCentsRef = useRef<number>(0);
  const tunerFreqHistoryRef = useRef<number[]>([]);
  const tunerLastCentsRef = useRef<number>(0);
  const tunerVelocityRef = useRef<number>(0);
  const tunerConfidenceRef = useRef<number>(0);
  const tunerBeepContextRef = useRef<AudioContext | null>(null);
  const tunerMeterRef = useRef<HTMLDivElement | null>(null);

  // Guitar Tuner helper functions
  const getNearestString = useCallback((frequency: number) => {
    let best = GUITAR_STRINGS[0];
    let minDiff = Math.abs(frequency - best.freq);
    for (let i = 1; i < GUITAR_STRINGS.length; i++) {
      const diff = Math.abs(frequency - GUITAR_STRINGS[i].freq);
      if (diff < minDiff) {
        minDiff = diff;
        best = GUITAR_STRINGS[i];
      }
    }
    return best;
  }, []);

  const getTargetString = useCallback(() => {
    if (tunerSelectedTarget === 'AUTO') return null;
    return GUITAR_STRINGS.find((s) => s.name === tunerSelectedTarget) || null;
  }, [tunerSelectedTarget]);

  const frequencyToNoteName = useCallback((frequency: number) => {
    if (!frequency || frequency <= 0) return '—';
    const A4 = 440;
    const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const midi = Math.round(12 * Math.log2(frequency / A4) + 69);
    const note = NOTES[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    return `${note}${octave}`;
  }, []);

  const centsOff = useCallback((frequency: number, target: number) => {
    if (!frequency || !target || frequency <= 0 || target <= 0) return 0;
    return Math.round(1200 * Math.log2(frequency / target));
  }, []);

  const medianFilter = useCallback((value: number, history: number[], size = 5) => {
    history.push(value);
    if (history.length > size) history.shift();
    const sorted = [...history].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }, []);

  const correctOctave = useCallback((detected: number, target: number) => {
    let corrected = detected;
    while (corrected > target * 1.5) corrected /= 2;
    while (corrected < target * 0.75) corrected *= 2;
    return corrected;
  }, []);

  // Autocorrelation-based pitch detection
  const autoCorrelate = useCallback((buf: Float32Array, sampleRate: number) => {
    const SIZE = buf.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.005) return -1;

    const minPeriod = Math.floor(sampleRate / 500);
    const maxPeriod = Math.floor(sampleRate / 75);

    let r1 = 0, r2 = SIZE - 1;
    const thresh = 0.15;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buf[i]) < thresh) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buf[SIZE - i]) < thresh) {
        r2 = SIZE - i;
        break;
      }
    }

    const trimmed = buf.slice(r1, r2);
    const newSize = trimmed.length;
    const autocorr = new Float32Array(newSize);

    for (let lag = 0; lag < newSize; lag++) {
      let sum = 0;
      for (let i = 0; i < newSize - lag; i++) sum += trimmed[i] * trimmed[i + lag];
      autocorr[lag] = sum;
    }

    const norm = autocorr[0];
    if (norm === 0) return -1;
    for (let i = 0; i < newSize; i++) autocorr[i] /= norm;

    let peakIndex = -1;
    let peakValue = 0;
    const searchStart = Math.max(minPeriod, 1);
    const searchEnd = Math.min(maxPeriod, newSize - 1);

    for (let i = searchStart; i < searchEnd; i++) {
      if (
        autocorr[i] > 0.4 &&
        autocorr[i] > autocorr[i - 1] &&
        autocorr[i] >= autocorr[i + 1] &&
        autocorr[i] > peakValue
      ) {
        peakValue = autocorr[i];
        peakIndex = i;
      }
    }

    if (peakIndex <= 0 || peakValue < 0.4) return -1;

    const x0 = peakIndex - 1;
    const x2 = peakIndex + 1;
    const y0 = autocorr[x0];
    const y1 = autocorr[peakIndex];
    const y2 = autocorr[x2];
    const denom = y0 - 2 * y1 + y2;
    const shift = denom !== 0 ? (0.5 * (y0 - y2)) / denom : 0;
    const refined = peakIndex + shift;

    const freq = sampleRate / refined;
    if (!isFinite(freq) || freq <= 0 || freq < 70 || freq > 500) return -1;
    return freq;
  }, []);

  // Play reference beep
  const playReferenceBeep = useCallback(() => {
    const target = getTargetString();
    if (!target) {
      setTunerStatus('Select a string to play reference beep.');
      return;
    }

    let ctx = tunerBeepContextRef.current;
    if (!ctx || ctx.state === 'closed') {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      tunerBeepContextRef.current = ctx;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(target.freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 1.0);

    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.05);
    setTunerStatus(`Reference beep: ${target.name}`);
  }, [getTargetString]);

  // Tuner update loop
  const tunerUpdate = useCallback(() => {
    if (!tunerRunningRef.current) return;

    const analyser = tunerAnalyserRef.current;
    const audioContext = tunerAudioContextRef.current;
    const timeData = tunerTimeDataRef.current;

    if (!analyser || !audioContext || !timeData) return;

    analyser.getFloatTimeDomainData(timeData);
    let freq = autoCorrelate(timeData, audioContext.sampleRate);

    if (freq > 0) {
      const target = getTargetString();
      const base = target ? target : getNearestString(freq);

      if (target) {
        freq = correctOctave(freq, base.freq);
      }

      const filterSize = freq > 200 ? 4 : 7;
      freq = medianFilter(freq, tunerFreqHistoryRef.current, filterSize);

      const cents = centsOff(freq, base.freq);
      const noteName = frequencyToNoteName(freq);

      const baseDiff = Math.abs(cents - tunerSmoothedCentsRef.current);
      const isHighFreq = freq > 200;

      tunerVelocityRef.current = 0.7 * tunerVelocityRef.current + 0.3 * (cents - tunerLastCentsRef.current);
      tunerLastCentsRef.current = cents;

      const velocityFactor = Math.max(0.5, 1 - Math.abs(tunerVelocityRef.current) / 30);

      let alpha: number;
      if (target) {
        alpha = isHighFreq
          ? baseDiff > 15 ? 0.3 : 0.2
          : baseDiff > 15 ? 0.25 : 0.15;
        alpha *= velocityFactor;
      } else {
        alpha = (baseDiff > 10 ? 0.45 : 0.35) * velocityFactor;
      }

      tunerSmoothedCentsRef.current = tunerSmoothedCentsRef.current + alpha * (cents - tunerSmoothedCentsRef.current);
      const smoothedCents = tunerSmoothedCentsRef.current;

      const stability = 1 - Math.min(1, Math.abs(tunerVelocityRef.current) / 20);
      tunerConfidenceRef.current = 0.8 * tunerConfidenceRef.current + 0.2 * stability;
      const confidence = tunerConfidenceRef.current;

      const good = Math.abs(smoothedCents) <= 5 && confidence > 0.6;
      const settling = confidence < 0.5;

      setTunerFrequency(freq);
      setTunerNote(noteName);
      setTunerCents(Math.round(smoothedCents));
      setTunerConfidence(confidence);
      setTunerIsInTune(good);
      setTunerIsSettling(settling);

      const statusMsg = good ? 'In tune!' : settling ? 'Settling…' : 'Tuning…';
      setTunerStatus(statusMsg);
    } else {
      setTunerStatus('Listening… (no stable pitch)');
      setTunerCents(0);
      setTunerFrequency(null);
      setTunerNote('—');
      tunerSmoothedCentsRef.current = 0;
    }

    tunerRafIdRef.current = requestAnimationFrame(tunerUpdate);
  }, [autoCorrelate, centsOff, correctOctave, frequencyToNoteName, getNearestString, getTargetString, medianFilter]);

  // Start tuner
  const startTuner = useCallback(async () => {
    if (tunerRunningRef.current) return;

    try {
      setTunerStatus('Requesting microphone…');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      tunerMediaStreamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      tunerAudioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      tunerAnalyserRef.current = analyser;
      tunerTimeDataRef.current = new Float32Array(analyser.fftSize);
      
      source.connect(analyser);
      
      tunerRunningRef.current = true;
      setTunerRunning(true);
      setTunerStatus('Listening…');
      
      tunerUpdate();
    } catch (err) {
      console.error(err);
      setTunerStatus('Microphone permission denied or unavailable.');
    }
  }, [tunerUpdate]);

  // Stop tuner
  const stopTuner = useCallback(() => {
    tunerRunningRef.current = false;
    setTunerRunning(false);

    if (tunerRafIdRef.current) {
      cancelAnimationFrame(tunerRafIdRef.current);
      tunerRafIdRef.current = null;
    }

    if (tunerMediaStreamRef.current) {
      for (const track of tunerMediaStreamRef.current.getTracks()) {
        track.stop();
      }
      tunerMediaStreamRef.current = null;
    }

    if (tunerAudioContextRef.current) {
      tunerAudioContextRef.current.close();
      tunerAudioContextRef.current = null;
    }

    setTunerStatus('Stopped');
    setTunerFrequency(null);
    setTunerNote('—');
    setTunerCents(0);
    setTunerConfidence(0);
    setTunerIsInTune(false);
    setTunerIsSettling(false);
    tunerSmoothedCentsRef.current = 0;
    tunerFreqHistoryRef.current = [];
    tunerLastCentsRef.current = 0;
    tunerVelocityRef.current = 0;
    tunerConfidenceRef.current = 0;
  }, []);

  // Handle string selection
  const selectTunerString = useCallback((stringName: string) => {
    setTunerSelectedTarget(stringName);
    tunerSmoothedCentsRef.current = 0;
    tunerFreqHistoryRef.current = [];
    tunerLastCentsRef.current = 0;
    tunerVelocityRef.current = 0;
    tunerConfidenceRef.current = 0;
  }, []);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Persist active tab to localStorage
  useEffect(() => {
    localStorage.setItem('studentPortalActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
      
      if (user) {
        // Check if user is admin
        const isAdmin = user.email === 'grantmatai@gmail.com';
        setIsAdminMode(isAdmin);
        
        if (!isAdmin) {
          // Load data for regular student only
          loadStudentData(user.id);
        } else {
          // For admin users, clear data until they select a student
          setMaterials([]);
          setAssignments([]);
          setVideos([]);
        }
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const isAdmin = session.user.email === 'grantmatai@gmail.com';
          setIsAdminMode(isAdmin);
          
          if (!isAdmin) {
            loadStudentData(session.user.id);
          } else {
            // For admin users, clear data until they select a student
            setMaterials([]);
            setAssignments([]);
            setVideos([]);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Load students when user is set and is admin
  useEffect(() => {
    if (user && isAdminMode) {
      console.log('User is admin, loading students...');
      loadStudentsForAdmin();
    }
  }, [user, isAdminMode]);

  // Reset material index when materials change
  useEffect(() => {
    if (materials.length > 0 && currentMaterialIndex >= materials.length) {
      setCurrentMaterialIndex(0);
    }
  }, [materials, currentMaterialIndex]);

  // Reset video index when videos change
  useEffect(() => {
    if (videos.length > 0 && currentVideoIndex >= videos.length) {
      setCurrentVideoIndex(0);
    }
  }, [videos, currentVideoIndex]);

  // Feature detection for tuner
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      setTunerSupported(supported);
      if (!supported) {
        setTunerStatus('getUserMedia not supported in this browser.');
      }
    }
  }, []);

  // Cleanup tuner when leaving the tab or unmounting
  useEffect(() => {
    if (activeTab !== 'tuner' && tunerRunning) {
      stopTuner();
    }
  }, [activeTab, tunerRunning, stopTuner]);

  // Cleanup tuner on unmount
  useEffect(() => {
    return () => {
      if (tunerRunningRef.current) {
        tunerRunningRef.current = false;
        if (tunerRafIdRef.current) {
          cancelAnimationFrame(tunerRafIdRef.current);
        }
        if (tunerMediaStreamRef.current) {
          for (const track of tunerMediaStreamRef.current.getTracks()) {
            track.stop();
          }
        }
        if (tunerAudioContextRef.current) {
          tunerAudioContextRef.current.close();
        }
        if (tunerBeepContextRef.current && tunerBeepContextRef.current.state !== 'closed') {
          tunerBeepContextRef.current.close();
        }
      }
    };
  }, []);

  // Load students list for admin mode
  const loadStudentsForAdmin = async () => {
    if (!user || !user.email) {
      console.error('No user or email available for loading students');
      return;
    }

    try {
      console.log('Loading students for admin:', user.email);
      const response = await fetch(`/api/admin/students?userEmail=${encodeURIComponent(user.email)}`);
      const result = await response.json();

      console.log('Students API response:', { status: response.status, result });
      console.log('Full result data:', result.data);
      console.log('Result data type:', typeof result.data, Array.isArray(result.data));

      if (response.ok) {
        setStudents(result.data || []);
        console.log('Loaded students:', result.data?.length || 0);
        
        // Auto-select first student if available
        if (result.data && result.data.length > 0) {
          const firstStudentId = result.data[0].id;
          setSelectedStudentId(firstStudentId);
          loadStudentDataViaAPI(firstStudentId);
        }
      } else {
        console.error('Error loading students:', result.error);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  // Load student data via API for admin mode (bypasses RLS issues)
  const loadStudentDataViaAPI = async (studentId: string) => {
    if (!user || !isAdminMode) return;
    
    try {
      console.log('Loading student data via API for student ID:', studentId);
      const response = await fetch(`/api/admin/materials?studentId=${studentId}&userEmail=${user.email}`);
      const result = await response.json();

      console.log('API materials response:', result);

      if (response.ok) {
        console.log('Setting materials from API:', result.data?.length || 0, 'items');
        setMaterials(result.data || []);
      } else {
        console.error('Error loading materials via API:', result.error);
        setMaterials([]);
      }

      // Load assignments via API (for admin mode)
      const assignmentsResponse = await fetch(`/api/admin/assignments?studentId=${studentId}&userEmail=${encodeURIComponent(user?.email || '')}`);
      
      if (assignmentsResponse.ok) {
        const assignmentsResult = await assignmentsResponse.json();
        if (assignmentsResult.success) {
          setAssignments(assignmentsResult.data || []);
        } else {
          console.error('Error loading assignments via API:', assignmentsResult.error);
          setAssignments([]);
        }
      } else {
        console.error('Error loading assignments via API:', assignmentsResponse.statusText);
        setAssignments([]);
      }

      // Load videos via API (for admin mode)
      const videosResponse = await fetch(`/api/admin/videos?studentId=${studentId}&userEmail=${encodeURIComponent(user?.email || '')}`);
      
      if (videosResponse.ok) {
        const videosResult = await videosResponse.json();
        if (videosResult.success) {
          setVideos(videosResult.data || []);
        } else {
          console.error('Error loading videos via API:', videosResult.error);
          setVideos([]);
        }
      } else {
        console.error('Error loading videos via API:', videosResponse.statusText);
        setVideos([]);
      }
    } catch (error) {
      console.error('Error loading student data via API:', error);
      setMaterials([]);
      setAssignments([]);
      setVideos([]);
    }
  };

  // Handle student selection change in admin mode
  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    loadStudentDataViaAPI(studentId);
  };

  const loadStudentData = async (userId: string) => {
    try {
      console.log('Loading student data for user ID:', userId);
      
      // Load materials via student API
      const materialsResponse = await fetch(`/api/student/materials?studentId=${userId}`);
      
      if (materialsResponse.ok) {
        const materialsResult = await materialsResponse.json();
        if (materialsResult.success) {
          console.log('Setting materials:', materialsResult.data?.length || 0, 'items');
          setMaterials(materialsResult.data || []);
        } else {
          console.error('Error loading materials:', materialsResult.error);
          setMaterials([]);
        }
      } else {
        console.error('Error loading materials:', materialsResponse.statusText);
        setMaterials([]);
      }

      // Load assignments via student API
      const assignmentsResponse = await fetch(`/api/student/assignments?studentId=${userId}`);
      
      if (assignmentsResponse.ok) {
        const assignmentsResult = await assignmentsResponse.json();
        if (assignmentsResult.success) {
          setAssignments(assignmentsResult.data || []);
        } else {
          console.error('Error loading assignments:', assignmentsResult.error);
          setAssignments([]);
        }
      } else {
        console.error('Error loading assignments:', assignmentsResponse.statusText);
        setAssignments([]);
      }

      // Load videos via student API
      const videosResponse = await fetch(`/api/student/videos?studentId=${userId}`);
      
      if (videosResponse.ok) {
        const videosResult = await videosResponse.json();
        if (videosResult.success) {
          setVideos(videosResult.data || []);
        } else {
          console.error('Error loading videos:', videosResult.error);
          setVideos([]);
        }
      } else {
        console.error('Error loading videos:', videosResponse.statusText);
        setVideos([]);
      }
    } catch (error) {
      console.error('Error loading student data:', error);
    }
  };

  // Habit tracker data fetching
  const loadHabits = async (studentId: string, year: number, month: number) => {
    try {
      setHabitLoading(true);
      const response = await fetch(`/api/student/habits?studentId=${studentId}&year=${year}&month=${month + 1}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const dates = new Set<string>((result.data || []).map((h: any) => h.date));
          setHabitDates(dates);
        }
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setHabitLoading(false);
    }
  };

  const loadHabitsViaAPI = async (studentId: string, year: number, month: number) => {
    if (!user || !isAdminMode) return;
    try {
      setHabitLoading(true);
      const response = await fetch(`/api/admin/habits?studentId=${studentId}&userEmail=${encodeURIComponent(user.email)}&year=${year}&month=${month + 1}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const dates = new Set<string>((result.data || []).map((h: any) => h.date));
          setHabitDates(dates);
        }
      }
    } catch (error) {
      console.error('Error loading habits via API:', error);
    } finally {
      setHabitLoading(false);
    }
  };

  const toggleHabit = async (dateStr: string) => {
    try {
      if (isAdminMode && selectedStudentId) {
        const response = await fetch(`/api/admin/habits?userEmail=${encodeURIComponent(user?.email || '')}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: selectedStudentId, date: dateStr })
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setHabitDates(prev => {
              const next = new Set(prev);
              if (result.completed) {
                next.add(dateStr);
              } else {
                next.delete(dateStr);
              }
              return next;
            });
          }
        }
      } else if (user) {
        const response = await fetch(`/api/student/habits?studentId=${user.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: dateStr })
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setHabitDates(prev => {
              const next = new Set(prev);
              if (result.completed) {
                next.add(dateStr);
              } else {
                next.delete(dateStr);
              }
              return next;
            });
          }
        }
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  // Reload habits when habit calendar month changes
  useEffect(() => {
    const studentId = isAdminMode ? selectedStudentId : user?.id;
    if (!studentId) return;
    if (isAdminMode) {
      loadHabitsViaAPI(studentId, habitViewYear, habitViewMonth);
    } else {
      loadHabits(studentId, habitViewYear, habitViewMonth);
    }
  }, [habitViewYear, habitViewMonth, isAdminMode, selectedStudentId, user?.id]);

  // Habit calendar helpers
  const habitPad2 = (v: number) => v.toString().padStart(2, '0');
  const habitDateKey = (year: number, monthIndex: number, day: number) =>
    `${year}-${habitPad2(monthIndex + 1)}-${habitPad2(day)}`;

  const buildHabitMonthGrid = (year: number, monthIndex: number) => {
    const firstOfMonth = new Date(year, monthIndex, 1);
    const startDayIndex = firstOfMonth.getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const grid: (number | null)[] = [];
    for (let i = 0; i < startDayIndex; i++) grid.push(null);
    for (let day = 1; day <= daysInMonth; day++) grid.push(day);
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  };

  const habitPrevMonth = () => {
    const d = new Date(habitViewYear, habitViewMonth - 1, 1);
    setHabitViewYear(d.getFullYear());
    setHabitViewMonth(d.getMonth());
  };

  const habitNextMonth = () => {
    const now = new Date();
    if (habitViewYear === now.getFullYear() && habitViewMonth === now.getMonth()) return;
    const d = new Date(habitViewYear, habitViewMonth + 1, 1);
    setHabitViewYear(d.getFullYear());
    setHabitViewMonth(d.getMonth());
  };

  const downloadMaterial = async (material: any) => {
    try {
      const response = await fetch(`/api/materials/download?filePath=${encodeURIComponent(material.file_path)}&studentId=${isAdminMode ? selectedStudentId : user?.id}&userEmail=${encodeURIComponent(user?.email || '')}`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = material.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading material:', error);
    }
  };

  // Memoize the load function to prevent dependency loops
  const loadMaterialForViewing = useCallback(async (material: any) => {
    if (materialUrls[material.id]) {
      return materialUrls[material.id];
    }

    try {
      const response = await fetch(`/api/materials/download?filePath=${encodeURIComponent(material.file_path)}&studentId=${isAdminMode ? selectedStudentId : user?.id}&userEmail=${encodeURIComponent(user?.email || '')}`);
      
      if (!response.ok) {
        throw new Error(`Load failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setMaterialUrls(prev => ({ ...prev, [material.id]: url }));
      return url;
    } catch (error) {
      console.error('Error loading material for viewing:', error);
      return null;
    }
  }, [materialUrls, isAdminMode, selectedStudentId, user?.id, user?.email]);

  const nextMaterial = () => {
    if (materials.length > 0) {
      setCurrentMaterialIndex((prev) => (prev + 1) % materials.length);
    }
  };

  const previousMaterial = () => {
    if (materials.length > 0) {
      setCurrentMaterialIndex((prev) => (prev - 1 + materials.length) % materials.length);
    }
  };

  const nextVideo = () => {
    if (videos.length > 0) {
      setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
    }
  };

  const previousVideo = () => {
    if (videos.length > 0) {
      setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);
    }
  };

  const isViewableFileType = (fileType: string) => {
    return fileType.startsWith('image/') || fileType === 'application/pdf';
  };

// Video Player Component (simplified version based on music page)
const VideoPlayer = ({ videos, currentIndex, onVideoChange }: any) => {
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentKey, setCurrentKey] = useState(0);
  
  const currentVideo = videos[currentIndex];

  // Load YouTube Player API
  useEffect(() => {
    if (typeof window === 'undefined' || !currentVideo) return;

    // Load YouTube API if not already loaded
    if (!window.YT) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    } else {
      initializePlayer();
    }
  }, [currentVideo?.youtube_id, currentKey]);

  const initializePlayer = () => {
    if (!window.YT || !window.YT.Player || !currentVideo) return;

    // Destroy old player if it exists
    if (player) {
      try {
        player.destroy();
      } catch (error) {
        console.log('Error destroying old player:', error);
      }
      setPlayer(null);
    }

    try {
      const newPlayer = new window.YT.Player(`youtube-player-${currentKey}`, {
        height: '100%',
        width: '100%',
        videoId: currentVideo.youtube_id,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          controls: 1,
          autoplay: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            setPlayer(event.target);
          },
          onError: (event: any) => {
            console.error('YouTube player error:', event.data);
          }
        },
      });
    } catch (error) {
      console.error('Error creating YouTube player:', error);
    }
  };

  const togglePlay = () => {
    if (player) {
      if (isPlaying) {
        player.pauseVideo();
        setIsPlaying(false);
      } else {
        player.playVideo();
        setIsPlaying(true);
      }
    }
  };

  const selectVideo = (index: number) => {
    onVideoChange(index);
    setIsPlaying(false);
    setCurrentKey(prev => prev + 1);
  };

  if (!currentVideo) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">No videos available</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-8 shadow-forest" style={{backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)'}}>
      {/* Main Video Player */}
      <div className="aspect-video rounded-2xl overflow-hidden mb-6 relative">
        <div
          id={`youtube-player-${currentKey}`}
          className="w-full h-full rounded-2xl"
        ></div>
      </div>
      
      {/* Video Info */}
      <div className="mb-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-white mb-2">
            {currentVideo.title}
          </h3>
          {currentVideo.description && (
            <p className="text-white text-opacity-70 text-sm">
              {currentVideo.description}
            </p>
          )}
        </div>
        
        {/* Video Controls - Centered on mobile, right-aligned on desktop */}
        <div className="flex items-center justify-center space-x-4 sm:justify-end">
          <button
            onClick={() => {
              const newIndex = (currentIndex - 1 + videos.length) % videos.length;
              selectVideo(newIndex);
            }}
            className="p-3 rounded-full hover:scale-110 transition-transform"
            style={{backgroundColor: '#BC6A1B'}}
            disabled={videos.length <= 1}
          >
            <BackwardIcon className="w-6 h-6 text-white" />
          </button>
          
          <button
            onClick={togglePlay}
            className="p-4 rounded-full hover:scale-110 transition-transform"
            style={{backgroundColor: '#602718'}}
          >
            {isPlaying ? (
              <div className="w-8 h-8 flex items-center justify-center">
                <div className="w-2 h-6 bg-white rounded mr-1"></div>
                <div className="w-2 h-6 bg-white rounded"></div>
              </div>
            ) : (
              <PlayIcon className="w-8 h-8 text-white ml-1" />
            )}
          </button>
          
          <button
            onClick={() => {
              const newIndex = (currentIndex + 1) % videos.length;
              selectVideo(newIndex);
            }}
            className="p-3 rounded-full hover:scale-110 transition-transform"
            style={{backgroundColor: '#BC6A1B'}}
            disabled={videos.length <= 1}
          >
            <ForwardIcon className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
      
      {/* Video List */}
      {videos.length > 1 && (
        <div className="border-t border-white border-opacity-20 pt-6">
          <h4 className="text-lg font-semibold text-white mb-4">Assigned Videos ({videos.length})</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {videos.map((video: any, index: number) => (
              <button
                key={video.id}
                onClick={() => selectVideo(index)}
                className={`w-full flex items-center space-x-4 p-3 rounded-xl transition-all hover:bg-white hover:bg-opacity-10 ${
                  index === currentIndex ? 'ring-2 ring-orange-400 bg-orange-900 bg-opacity-30' : ''
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-20 h-12 object-cover rounded-lg"
                  />
                  {index === currentIndex && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{backgroundColor: '#BC6A1B'}}>
                        <PlayIcon className="w-3 h-3 text-white ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-medium text-sm line-clamp-1 ${
                    index === currentIndex ? 'text-white' : 'text-white'
                  }`}>
                    {video.title}
                  </p>
                  {video.description && (
                    <p className={`text-xs line-clamp-1 ${
                      index === currentIndex ? 'text-white text-opacity-80' : 'text-white text-opacity-60'
                    }`}>
                      {video.description}
                    </p>
                  )}
                </div>
                <div className="text-xs text-white text-opacity-60">
                  {index + 1}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Material Viewer Component
const MaterialViewer = ({ material, materialUrls, loadMaterialForViewing }: any) => {
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMaterial = async () => {
      if (!material) return;
      
      setLoading(true);
      if (materialUrls[material.id]) {
        setViewUrl(materialUrls[material.id]);
        setLoading(false);
      } else if (isViewableFileType(material.file_type)) {
        const url = await loadMaterialForViewing(material);
        setViewUrl(url);
        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    loadMaterial();
  }, [material, materialUrls, loadMaterialForViewing]);

  if (!material) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">No material selected</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading material...</p>
        </div>
      </div>
    );
  }

  if (!isViewableFileType(material.file_type)) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">{material.file_name}</p>
          <p className="text-gray-500 text-sm mt-2">Preview not available for this file type</p>
          <p className="text-gray-500 text-sm">Use the download button to view this file</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gray-100">
      {material.file_type.startsWith('image/') ? (
        <div className="flex items-center justify-center min-h-96 p-4">
          <img
            src={viewUrl || ''}
            alt={material.file_name}
            className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
          />
        </div>
      ) : material.file_type === 'application/pdf' ? (
        <iframe
          src={viewUrl || ''}
          className="w-full h-96 border-0"
          title={material.file_name}
        />
      ) : null}
    </div>
  );
};

  const toggleAssignmentComplete = async (assignmentId: string, completed: boolean) => {
    try {
      if (isAdminMode && selectedStudentId) {
        // Admin mode - use admin API
        const userEmail = encodeURIComponent(user?.email || '');
        const response = await fetch(`/api/admin/assignments?userEmail=${userEmail}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignmentId,
            completed: !completed
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update assignment');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to update assignment');
        }

        // Reload assignments
        loadStudentDataViaAPI(selectedStudentId);
      } else if (user) {
        // Student mode - use student API
        const response = await fetch(`/api/student/assignments?studentId=${user.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignmentId,
            completed: !completed
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update assignment');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to update assignment');
        }

        // Reload assignments
        loadStudentData(user.id);
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#87AA6A'}}>
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#87AA6A'}}>
          <div className="text-center text-white">
            <AcademicCapIcon className="h-16 w-16 mx-auto mb-4 opacity-80" />
            <h1 className="text-2xl font-bold mb-4">Student Portal</h1>
            <p className="text-lg mb-8">Please sign in to access your materials and assignments.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen" style={{backgroundColor: '#87AA6A'}}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-white mb-2">
              {isAdminMode ? 'Student Portal - Admin Preview' : 'Student Portal'}
            </h1>
            <p className="text-white text-opacity-80">
              {isAdminMode ? `Logged in as Admin: ${user.email}` : `Welcome back, ${user.email}`}
            </p>
          </motion.div>

          {/* Admin Student Selector */}
          {isAdminMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 p-4 rounded-lg"
              style={{backgroundColor: 'rgba(255,255,255,0.1)'}}
            >
              <div className="flex items-center justify-center space-x-4">
                <label className="text-white font-semibold">Preview Student Portal for:</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Select a student...</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.user_metadata?.first_name && student.user_metadata?.last_name 
                        ? `${student.user_metadata.first_name} ${student.user_metadata.last_name} (${student.email})`
                        : student.email}
                    </option>
                  ))}
                </select>
                {selectedStudentId && (
                  <span className="text-white text-sm opacity-80">
                    (Viewing as: {(() => {
                      const student = students.find(s => s.id === selectedStudentId);
                      if (!student) return 'Unknown Student';
                      if (student.user_metadata?.first_name && student.user_metadata?.last_name) {
                        return `${student.user_metadata.first_name} ${student.user_metadata.last_name}`;
                      }
                      return student.email;
                    })()})
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* Show content only if: not admin mode OR admin mode with student selected */}
          {(!isAdminMode || selectedStudentId) ? (
            <>
              {/* Tab Navigation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <div className="flex flex-wrap gap-2 bg-white bg-opacity-20 p-2 rounded-lg">
                  <button
                    onClick={() => setActiveTab('materials')}
                    className={`flex-1 min-w-[140px] px-3 sm:px-6 py-2 sm:py-3 rounded-md font-medium transition-all duration-200 border-2 text-sm sm:text-base ${
                      activeTab === 'materials'
                        ? 'bg-green-600 text-white shadow-md border-green-600'
                        : 'text-green-800 bg-white hover:bg-gray-100 border-white'
                    }`}
                  >
                    <DocumentTextIcon className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Your </span>Materials
                  </button>
                  <button
                    onClick={() => setActiveTab('videos')}
                    className={`flex-1 min-w-[100px] px-3 sm:px-6 py-2 sm:py-3 rounded-md font-medium transition-all duration-200 border-2 text-sm sm:text-base ${
                      activeTab === 'videos'
                        ? 'bg-green-600 text-white shadow-md border-green-600'
                        : 'text-green-800 bg-white hover:bg-gray-100 border-white'
                    }`}
                  >
                    <PlayIcon className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
                    Videos
                  </button>
                  <button
                    onClick={() => setActiveTab('schedule')}
                    className={`flex-1 min-w-[120px] px-3 sm:px-6 py-2 sm:py-3 rounded-md font-medium transition-all duration-200 border-2 text-sm sm:text-base ${
                      activeTab === 'schedule'
                        ? 'bg-green-600 text-white shadow-md border-green-600'
                        : 'text-green-800 bg-white hover:bg-gray-100 border-white'
                    }`}
                  >
                    <CalendarDaysIcon className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
                    <span className="hidden md:inline">Practice </span>Assignments
                  </button>
                  <button
                    onClick={() => setActiveTab('habits')}
                    className={`flex-1 min-w-[120px] px-3 sm:px-6 py-2 sm:py-3 rounded-md font-medium transition-all duration-200 border-2 text-sm sm:text-base ${
                      activeTab === 'habits'
                        ? 'bg-green-600 text-white shadow-md border-green-600'
                        : 'text-green-800 bg-white hover:bg-gray-100 border-white'
                    }`}
                  >
                    <FireIcon className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Habit </span>Tracker
                  </button>
                  <button
                    onClick={() => setActiveTab('tuner')}
                    className={`flex-1 min-w-[100px] px-3 sm:px-6 py-2 sm:py-3 rounded-md font-medium transition-all duration-200 border-2 text-sm sm:text-base ${
                      activeTab === 'tuner'
                        ? 'bg-green-600 text-white shadow-md border-green-600'
                        : 'text-green-800 bg-white hover:bg-gray-100 border-white'
                    }`}
                  >
                    <MusicalNoteIcon className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
                    Tuner
                  </button>
                </div>
              </motion.div>

              {/* Tab Content */}
              {activeTab === 'materials' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden"
                >
                  {materials.length === 0 ? (
                    <div className="text-center py-12 p-8">
                      <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      {isAdminMode && !selectedStudentId ? (
                        <>
                          <p className="text-gray-600 text-lg">Please select a student to view their materials.</p>
                          <p className="text-gray-500">Use the dropdown above to choose a student.</p>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-600 text-lg">No materials uploaded yet.</p>
                          <p className="text-gray-500">Check back later for new materials from your instructor.</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Material Viewer */}
                      <div className="relative">
                        <MaterialViewer 
                          material={materials[currentMaterialIndex]}
                          materialUrls={materialUrls}
                          loadMaterialForViewing={loadMaterialForViewing}
                        />
                        
                        {/* Navigation Controls */}
                        {materials.length > 1 && (
                          <>
                            <button
                              onClick={previousMaterial}
                              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all"
                            >
                              <ChevronLeftIcon className="h-6 w-6 text-gray-700" />
                            </button>
                            <button
                              onClick={nextMaterial}
                              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all"
                            >
                              <ChevronRightIcon className="h-6 w-6 text-gray-700" />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Material Info Bar */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 border-t">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{materials[currentMaterialIndex]?.file_name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span>Added {new Date(materials[currentMaterialIndex]?.created_at).toLocaleDateString()}</span>
                            {materials[currentMaterialIndex]?.file_size && (
                              <span>{(materials[currentMaterialIndex].file_size / 1024 / 1024).toFixed(1)} MB</span>
                            )}
                            {materials.length > 1 && (
                              <span>{currentMaterialIndex + 1} of {materials.length}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => downloadMaterial(materials[currentMaterialIndex])}
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                          Download
                        </button>
                      </div>

                      {/* Material Thumbnails */}
                      {materials.length > 1 && (
                        <div className="p-4 bg-gray-50">
                          <div className="flex space-x-2 overflow-x-auto">
                            {materials.map((material, index) => (
                              <button
                                key={material.id}
                                onClick={() => setCurrentMaterialIndex(index)}
                                className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 transition-all ${
                                  index === currentMaterialIndex
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                              >
                                <div className="w-full h-full flex items-center justify-center">
                                  <DocumentTextIcon className={`h-6 w-6 ${
                                    index === currentMaterialIndex ? 'text-green-600' : 'text-gray-400'
                                  }`} />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {activeTab === 'videos' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-xl shadow-xl overflow-hidden"
                  style={{backgroundColor: '#66732C'}}
                >
                  {videos.length === 0 ? (
                    <div className="text-center py-12 p-8">
                      <PlayIcon className="h-16 w-16 text-white text-opacity-60 mx-auto mb-4" />
                      {isAdminMode && !selectedStudentId ? (
                        <>
                          <p className="text-white text-lg">Please select a student to view their videos.</p>
                          <p className="text-white text-opacity-80">Use the dropdown above to choose a student.</p>
                        </>
                      ) : (
                        <>
                          <p className="text-white text-lg">No videos assigned yet.</p>
                          <p className="text-white text-opacity-80">Check back later for new educational videos from your instructor.</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="relative p-8">
                      <VideoPlayer 
                        videos={videos}
                        currentIndex={currentVideoIndex}
                        onVideoChange={setCurrentVideoIndex}
                      />
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'schedule' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl shadow-xl p-8"
                >
                  <div className="flex items-center mb-6">
                    <CalendarDaysIcon className="h-8 w-8 text-green-700 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-800">Practice Assignments</h2>
                  </div>

                  {assignments.length === 0 ? (
                    <div className="text-center py-12">
                      <CalendarDaysIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">No assignments scheduled yet.</p>
                      <p className="text-gray-500">Your practice assignments will appear here.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {assignments.map((assignment, index) => (
                        <motion.div
                          key={assignment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`border rounded-lg p-4 transition-all ${
                            assignment.completed
                              ? 'border-green-200 bg-green-50'
                              : 'border-gray-200 bg-white hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => toggleAssignmentComplete(assignment.id, assignment.completed)}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  assignment.completed
                                    ? 'border-green-500 bg-green-500'
                                    : 'border-gray-300 hover:border-green-400'
                                }`}
                              >
                                {assignment.completed && (
                                  <CheckIcon className="h-4 w-4 text-white" />
                                )}
                              </button>
                              <div>
                                <h3 className={`font-semibold ${
                                  assignment.completed ? 'text-green-800' : 'text-gray-800'
                                }`}>
                                  {assignment.title}
                                </h3>
                                <p className={`text-sm whitespace-pre-wrap ${
                                  assignment.completed ? 'text-green-600' : 'text-gray-600'
                                }`}>
                                  {assignment.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'habits' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl shadow-xl p-8"
                >
                  <div className="flex items-center mb-6">
                    <FireIcon className="h-8 w-8 text-green-700 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-800">Practice Habit Tracker</h2>
                  </div>

                  {/* Calendar */}
                  <div className="max-w-lg mx-auto">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        type="button"
                        onClick={habitPrevMonth}
                        className="w-9 h-9 rounded-full flex items-center justify-center bg-green-600 text-white hover:bg-green-700 transition-colors"
                      >
                        <ChevronLeftIcon className="h-5 w-5" />
                      </button>
                      <h3 className="text-xl font-bold text-gray-800">
                        {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(habitViewYear, habitViewMonth, 1))}
                      </h3>
                      <button
                        type="button"
                        onClick={habitNextMonth}
                        disabled={habitViewYear === new Date().getFullYear() && habitViewMonth === new Date().getMonth()}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                          habitViewYear === new Date().getFullYear() && habitViewMonth === new Date().getMonth()
                            ? 'bg-gray-300 text-gray-500 cursor-default'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Weekday Labels */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                        <div key={d} className="text-center text-sm font-semibold text-gray-500">{d}</div>
                      ))}
                    </div>

                    {/* Calendar Grid */}
                    {habitLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-7 gap-2">
                        {buildHabitMonthGrid(habitViewYear, habitViewMonth).map((day, i) => {
                          if (day === null) {
                            return <div key={`empty-${i}`} className="h-14" />;
                          }

                          const key = habitDateKey(habitViewYear, habitViewMonth, day);
                          const isCompleted = habitDates.has(key);
                          const today = new Date();
                          const isToday = habitViewYear === today.getFullYear() && habitViewMonth === today.getMonth() && day === today.getDate();

                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => toggleHabit(key)}
                              className={`relative h-14 rounded-xl border-2 font-semibold text-sm flex items-center justify-center transition-all hover:-translate-y-0.5 ${
                                isToday
                                  ? 'border-amber-500 shadow-md'
                                  : 'border-gray-200'
                              } ${
                                isCompleted
                                  ? 'bg-green-100 border-green-400'
                                  : 'bg-white hover:border-green-300'
                              }`}
                            >
                              <span className={`z-10 ${isCompleted ? 'text-green-800' : 'text-gray-700'}`}>{day}</span>
                              {isCompleted && (
                                <span className="absolute inset-2 rounded-full opacity-40" style={{backgroundColor: '#87AA6A'}} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Monthly Stats */}
                    <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 rounded-full inline-block" style={{backgroundColor: '#87AA6A', opacity: 0.6}} />
                        <span>Practiced</span>
                      </div>
                      <div>
                        <span className="font-bold text-green-700">{habitDates.size}</span> {habitDates.size === 1 ? 'day' : 'days'} this month
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'tuner' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-8"
                >
                  <div className="flex items-center mb-6">
                    <MusicalNoteIcon className="h-8 w-8 text-green-700 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-800">Guitar Tuner</h2>
                  </div>

                  {!tunerSupported ? (
                    <div className="text-center py-12">
                      <MicrophoneIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">Microphone access is not supported in this browser.</p>
                      <p className="text-gray-500">Please use a modern browser with HTTPS or localhost.</p>
                    </div>
                  ) : (
                    <div className="max-w-lg mx-auto">
                      {/* String Selection - NOW AT TOP */}
                      <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-3 text-center">Select String</p>
                        <div className="flex flex-wrap justify-center gap-2">
                          <button
                            onClick={() => selectTunerString('AUTO')}
                            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
                              tunerSelectedTarget === 'AUTO'
                                ? 'bg-green-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Auto
                          </button>
                          {GUITAR_STRINGS.map((string) => (
                            <button
                              key={string.name}
                              onClick={() => selectTunerString(string.name)}
                              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
                                tunerSelectedTarget === string.name
                                  ? 'bg-green-600 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {string.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Controls - NOW AT TOP, Mobile Optimized */}
                      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6">
                        {!tunerRunning ? (
                          <button
                            onClick={startTuner}
                            disabled={!tunerSupported}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <MicrophoneIcon className="h-5 w-5 mr-2" />
                            Start Tuning
                          </button>
                        ) : (
                          <button
                            onClick={stopTuner}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                          >
                            <StopIcon className="h-5 w-5 mr-2" />
                            Stop
                          </button>
                        )}
                        <button
                          onClick={playReferenceBeep}
                          disabled={tunerSelectedTarget === 'AUTO'}
                          className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <SpeakerWaveIcon className="h-5 w-5 mr-2" />
                          Reference Beep
                        </button>
                      </div>

                      {/* Status Display */}
                      <div className="text-center mb-4">
                        <p className={`text-lg font-medium ${
                          tunerIsInTune ? 'text-green-600' : 
                          tunerIsSettling ? 'text-amber-600' : 'text-gray-600'
                        }`}>
                          {tunerStatus}
                        </p>
                      </div>

                      {/* Tuning Meter */}
                      <div 
                        ref={tunerMeterRef}
                        className="relative h-24 bg-gray-100 rounded-xl mb-6 overflow-hidden"
                      >
                        {/* Scale markers */}
                        <div className="absolute inset-0 flex items-center justify-between px-4">
                          <span className="text-xs text-gray-400 font-mono">-50</span>
                          <span className="text-xs text-gray-400 font-mono">-25</span>
                          <span className="text-xs text-green-600 font-bold">0</span>
                          <span className="text-xs text-gray-400 font-mono">+25</span>
                          <span className="text-xs text-gray-400 font-mono">+50</span>
                        </div>

                        {/* Needle */}
                        <div 
                          className={`absolute top-1/2 left-1/2 w-1 h-16 -mt-8 rounded-full transition-all duration-75 ${
                            tunerIsInTune ? 'bg-green-500 shadow-lg shadow-green-500/50' : 
                            tunerIsSettling ? 'bg-amber-400' : 'bg-red-500'
                          }`}
                          style={{ 
                            transform: `translateX(calc(-50% + ${Math.max(-50, Math.min(50, tunerCents)) * 2}px))`,
                            opacity: tunerRunning ? Math.max(0.4, tunerConfidence) : 0.3
                          }}
                        />
                      </div>

                      {/* Frequency Display */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 text-center">
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">String</p>
                          <p className="text-lg sm:text-2xl font-bold text-gray-800">
                            {tunerSelectedTarget === 'AUTO' ? 'Auto' : tunerSelectedTarget}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Frequency</p>
                          <p className="text-lg sm:text-2xl font-bold text-gray-800">
                            {tunerFrequency ? tunerFrequency.toFixed(1) : '—'}
                            <span className="text-xs sm:text-sm font-normal text-gray-500"> Hz</span>
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Note</p>
                          <p className="text-lg sm:text-2xl font-bold text-gray-800">{tunerNote}</p>
                        </div>
                      </div>

                      {/* Cents Display */}
                      <div className="text-center mb-6">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Cents</p>
                        <p className={`text-3xl sm:text-4xl font-bold ${
                          tunerIsInTune ? 'text-green-600' : 
                          Math.abs(tunerCents) <= 10 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {tunerCents > 0 ? '+' : ''}{tunerCents}
                        </p>
                      </div>

                      {/* Tips */}
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>Tips:</strong> Play a single string clearly near your device&apos;s microphone. 
                          Select a specific string for more accurate tuning, or use Auto mode for quick detection.
                          The green center zone indicates you&apos;re in tune (within ±5 cents).
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </>
          ) : (
            /* Show message when admin hasn't selected a student */
            <div className="text-center text-white py-12">
              <AcademicCapIcon className="h-16 w-16 mx-auto mb-4 opacity-60" />
              <h2 className="text-xl font-semibold mb-2">Select a Student</h2>
              <p className="opacity-80">Choose a student from the dropdown above to preview their portal view.</p>
            </div>
          )}

          {/* Material Viewer Modal */}
        </div>
      </div>
    </>
  );
};

export default StudentPortal;
