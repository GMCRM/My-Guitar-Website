// TypeScript types for Guitar Practice feature

export interface BackingTrack {
  id: string;
  name: string;
  audio_url: string;
  created_at: string;
  updated_at: string;
}

export interface StrummingPattern {
  id: string;
  name: string | null;
  pattern_string: string;
  created_at: string;
  updated_at: string;
}

export interface MusicalKey {
  id: string;
  key_name: string;
  chord_i: string;
  chord_iv: string;
  chord_v: string;
  created_at: string;
  updated_at: string;
}

// Join table types (with expanded references)
export interface StudentBackingTrack {
  id: string;
  student_id: string;
  track_id: string;
  created_at: string;
  backing_tracks: BackingTrack;
}

export interface StudentStrummingPattern {
  id: string;
  student_id: string;
  pattern_id: string;
  created_at: string;
  strumming_patterns: StrummingPattern;
}

export interface StudentMusicalKey {
  id: string;
  student_id: string;
  key_id: string;
  created_at: string;
  musical_keys: MusicalKey;
}

// API response wrapper
export interface PracticeAssignments {
  tracks: BackingTrack[];
  patterns: StrummingPattern[];
  keys: MusicalKey[];
}

// Admin assignment payload
export interface AssignPracticePayload {
  studentId: string;
  trackIds: string[];
  patternIds: string[];
  keyIds: string[];
}
