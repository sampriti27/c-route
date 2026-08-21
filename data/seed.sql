-- C.Route Seed Data
-- Source: synthetic_v1 | Periods: 2025 (previous), 2026 (current)
-- Last updated: Aug 2026

-- ============================================================
-- 1. OCCUPATIONS
-- ============================================================
INSERT INTO `croute-hackathon.croute_market.occupations`
  (occupation_id, title, category, geography)
VALUES
  ('OCC001', 'Business Analyst',   'analytics', 'India'),
  ('OCC002', 'Data Analyst',       'analytics', 'India'),
  ('OCC003', 'Financial Analyst',  'finance',   'India'),
  ('OCC004', 'Product Manager',    'product',   'India'),
  ('OCC005', 'Marketing Analyst',  'marketing', 'India');

-- ============================================================
-- 2. SKILLS
-- ============================================================
INSERT INTO `croute-hackathon.croute_market.skills`
  (skill_id, skill_name, category)
VALUES
  ('SKL001', 'SQL',                  'technical'),
  ('SKL002', 'Excel',                'technical'),
  ('SKL003', 'Power BI',             'technical'),
  ('SKL004', 'Python',               'technical'),
  ('SKL005', 'Communication',        'soft'),
  ('SKL006', 'Finance Basics',       'domain'),
  ('SKL007', 'PowerPoint',           'technical'),
  ('SKL008', 'Tableau',              'technical'),
  ('SKL009', 'Statistical Analysis', 'technical'),
  ('SKL010', 'Product Thinking',     'domain');

-- ============================================================
-- 3. OCCUPATION_SKILLS (single period — importance is stable)
-- ============================================================
INSERT INTO `croute-hackathon.croute_market.occupation_skills`
  (occupation_id, skill_id, importance, period)
VALUES
  -- Business Analyst
  ('OCC001', 'SKL001', 0.90, '2026'),
  ('OCC001', 'SKL002', 0.80, '2026'),
  ('OCC001', 'SKL003', 0.75, '2026'),
  ('OCC001', 'SKL005', 0.85, '2026'),
  ('OCC001', 'SKL006', 0.70, '2026'),
  ('OCC001', 'SKL007', 0.65, '2026'),

  -- Data Analyst
  ('OCC002', 'SKL001', 0.95, '2026'),
  ('OCC002', 'SKL002', 0.60, '2026'),
  ('OCC002', 'SKL003', 0.70, '2026'),
  ('OCC002', 'SKL004', 0.85, '2026'),
  ('OCC002', 'SKL008', 0.75, '2026'),
  ('OCC002', 'SKL009', 0.80, '2026'),

  -- Financial Analyst
  ('OCC003', 'SKL001', 0.60, '2026'),
  ('OCC003', 'SKL002', 0.85, '2026'),
  ('OCC003', 'SKL003', 0.55, '2026'),
  ('OCC003', 'SKL006', 0.90, '2026'),
  ('OCC003', 'SKL007', 0.70, '2026'),
  ('OCC003', 'SKL009', 0.75, '2026'),

  -- Product Manager
  ('OCC004', 'SKL001', 0.65, '2026'),
  ('OCC004', 'SKL005', 0.85, '2026'),
  ('OCC004', 'SKL007', 0.70, '2026'),
  ('OCC004', 'SKL010', 0.90, '2026'),

  -- Marketing Analyst
  ('OCC005', 'SKL001', 0.65, '2026'),
  ('OCC005', 'SKL002', 0.70, '2026'),
  ('OCC005', 'SKL003', 0.80, '2026'),
  ('OCC005', 'SKL005', 0.85, '2026');

-- ============================================================
-- 4. MARKET_DEMAND (2025 = previous, 2026 = current)
-- ============================================================
INSERT INTO `croute-hackathon.croute_market.market_demand`
  (occupation_id, skill_id, period, demand_count, demand_share, source)
VALUES
  -- Business Analyst
  ('OCC001', 'SKL001', '2026', 410, 0.91, 'synthetic_v1'),
  ('OCC001', 'SKL001', '2025', 320, 0.82, 'synthetic_v1'),
  ('OCC001', 'SKL003', '2026', 290, 0.72, 'synthetic_v1'),
  ('OCC001', 'SKL003', '2025', 200, 0.51, 'synthetic_v1'),

  -- Data Analyst
  ('OCC002', 'SKL004', '2026', 490, 0.88, 'synthetic_v1'),
  ('OCC002', 'SKL004', '2025', 350, 0.75, 'synthetic_v1'),
  ('OCC002', 'SKL001', '2026', 610, 0.95, 'synthetic_v1'),
  ('OCC002', 'SKL001', '2025', 480, 0.90, 'synthetic_v1'),

  -- Financial Analyst
  ('OCC003', 'SKL006', '2026', 295, 0.89, 'synthetic_v1'),
  ('OCC003', 'SKL006', '2025', 280, 0.88, 'synthetic_v1'),
  ('OCC003', 'SKL002', '2026', 270, 0.83, 'synthetic_v1'),
  ('OCC003', 'SKL002', '2025', 260, 0.82, 'synthetic_v1'),

  -- Product Manager (added — was missing)
  ('OCC004', 'SKL010', '2026', 450, 0.87, 'synthetic_v1'),
  ('OCC004', 'SKL010', '2025', 380, 0.79, 'synthetic_v1'),
  ('OCC004', 'SKL005', '2026', 360, 0.82, 'synthetic_v1'),
  ('OCC004', 'SKL005', '2025', 310, 0.74, 'synthetic_v1'),
  ('OCC004', 'SKL001', '2026', 290, 0.71, 'synthetic_v1'),
  ('OCC004', 'SKL001', '2025', 250, 0.65, 'synthetic_v1'),

  -- Marketing Analyst (added — was missing)
  ('OCC005', 'SKL005', '2026', 320, 0.78, 'synthetic_v1'),
  ('OCC005', 'SKL005', '2025', 280, 0.71, 'synthetic_v1'),
  ('OCC005', 'SKL003', '2026', 240, 0.69, 'synthetic_v1'),
  ('OCC005', 'SKL003', '2025', 200, 0.61, 'synthetic_v1'),
  ('OCC005', 'SKL002', '2026', 260, 0.72, 'synthetic_v1'),
  ('OCC005', 'SKL002', '2025', 220, 0.65, 'synthetic_v1');

-- ============================================================
-- 5. SKILL_EDGES (co-occurrence, latest period only)
-- ============================================================
INSERT INTO `croute-hackathon.croute_market.skill_edges`
  (skill_a, skill_b, cooccurrence, period)
VALUES
  ('SKL001', 'SKL004', 0.85, '2026'),
  ('SKL001', 'SKL003', 0.78, '2026'),
  ('SKL001', 'SKL009', 0.76, '2026'),
  ('SKL002', 'SKL006', 0.72, '2026'),
  ('SKL003', 'SKL008', 0.80, '2026');