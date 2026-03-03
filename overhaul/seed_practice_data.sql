-- ============================================================
-- Guitar Practice Feature — Seed Data
-- Run this AFTER guitar_practice_setup.sql
-- ============================================================
-- Seed musical keys with standard I-IV-V progressions
INSERT INTO musical_keys (key_name, chord_i, chord_iv, chord_v)
VALUES ('C', 'C', 'F', 'G'),
    ('D', 'D', 'G', 'A'),
    ('E', 'E', 'A', 'B'),
    ('G', 'G', 'C', 'D'),
    ('A', 'A', 'D', 'E') ON CONFLICT DO NOTHING;
-- Seed sample strumming patterns
INSERT INTO strumming_patterns (name, pattern_string)
VALUES ('Basic Down-Up', '↓ ↓ ↑ ↑ ↓'),
    ('Alternating', '↓ ↑ ↓ ↑'),
    ('Simple Waltz', '↓ ↓ ↑') ON CONFLICT DO NOTHING;