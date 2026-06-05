-- ServiceChain — Expanded worker pool (~17 more, ≈20 total).
-- Run in the Supabase SQL editor after schema.sql. Idempotent (on conflict do nothing).
-- Wallets are placeholder testnet addresses — replace with real ones to receive STT.

insert into workers (id, name, role, emoji, skills, rating, jobs_done, available, location, tagline, wallet) values
  ('w4',  'Bilal Ahmed',   'Painter',        '🎨', '{painting,general}',        4.7, 84,  true,  'Lahore',     'Smooth finishes, no mess, on schedule.',              '0x00000000000000000000000000000000000a0004'),
  ('w5',  'Ayesha Malik',  'Carpenter',      '🪚', '{carpentry,furniture}',     4.8, 156, true,  'Islamabad',  'Custom furniture & repairs that last.',               '0x00000000000000000000000000000000000a0005'),
  ('w6',  'Usman Tariq',   'AC Technician',  '❄️', '{ac-repair,electrical}',    4.5, 73,  true,  'Karachi',    'Cooling fixed fast, all brands.',                     '0x00000000000000000000000000000000000a0006'),
  ('w7',  'Fatima Noor',   'Gardener',       '🌿', '{gardening,landscaping}',   4.9, 192, true,  'Lahore',     'Lush lawns & tidy hedges, weekly care.',              '0x00000000000000000000000000000000000a0007'),
  ('w8',  'Hamza Sheikh',  'Mover',          '📦', '{moving,delivery}',         4.4, 61,  true,  'Rawalpindi', 'Careful packing, on-time hauls.',                     '0x00000000000000000000000000000000000a0008'),
  ('w9',  'Zainab Riaz',   'Tech Support',   '💻', '{tech,it-support}',         4.7, 118, true,  'Islamabad',  'PCs, networks & smart devices sorted.',               '0x00000000000000000000000000000000000a0009'),
  ('w10', 'Imran Qureshi', 'Plumber',        '🔧', '{plumbing,general}',        4.6, 99,  true,  'Karachi',    '24/7 leak & drainage specialist.',                    '0x00000000000000000000000000000000000a000a'),
  ('w11', 'Sana Javed',    'Cleaner',        '🧹', '{cleaning,sanitization}',   4.8, 203, true,  'Lahore',     'Spotless homes & offices, eco products.',             '0x00000000000000000000000000000000000a000b'),
  ('w12', 'Tariq Mehmood', 'Electrician',    '⚡', '{electrical,wiring}',       4.5, 87,  true,  'Faisalabad', 'Safe wiring, panels & fault-finding.',                '0x00000000000000000000000000000000000a000c'),
  ('w13', 'Hira Aslam',    'Painter',        '🎨', '{painting,decor}',          4.9, 134, true,  'Islamabad',  'Interior & exterior, premium paints.',                '0x00000000000000000000000000000000000a000d'),
  ('w14', 'Kashif Raza',   'Carpenter',      '🪚', '{carpentry,doors}',         4.6, 76,  false, 'Karachi',    'Doors, cabinets & fittings expert.',                  '0x00000000000000000000000000000000000a000e'),
  ('w15', 'Nida Farooq',   'AC Technician',  '❄️', '{ac-repair,maintenance}',   4.7, 102, true,  'Lahore',     'Servicing, gas refills & installs.',                  '0x00000000000000000000000000000000000a000f'),
  ('w16', 'Owais Khan',    'Gardener',       '🌿', '{gardening,tree-care}',     4.5, 58,  true,  'Multan',     'Pruning, planting & seasonal cleanup.',               '0x00000000000000000000000000000000000a0010'),
  ('w17', 'Rabia Saleem',  'Mover',          '📦', '{moving,logistics}',        4.8, 141, true,  'Lahore',     'Home & office relocations, insured.',                 '0x00000000000000000000000000000000000a0011'),
  ('w18', 'Faisal Abbas',  'Tech Support',   '💻', '{tech,repair}',             4.6, 95,  true,  'Karachi',    'Laptop & phone repairs, data recovery.',              '0x00000000000000000000000000000000000a0012'),
  ('w19', 'Maham Tariq',   'Cleaner',        '🧹', '{cleaning,delivery}',       4.9, 187, true,  'Islamabad',  'Deep cleans + errands & doorstep drops.',             '0x00000000000000000000000000000000000a0013'),
  ('w20', 'Junaid Akhtar', 'Electrician',    '⚡', '{electrical,tech}',         4.7, 110, true,  'Lahore',     'Smart-home wiring & appliance installs.',             '0x00000000000000000000000000000000000a0014')
on conflict (id) do nothing;
