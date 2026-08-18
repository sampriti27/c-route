-- Aisha's current skills
WITH user_skills AS (
  SELECT skill_id FROM `croute_market.skills`
  WHERE skill_name IN ('Excel', 'Finance Basics', 'Communication', 'PowerPoint')
),
-- Skill overlap per occupation
skill_overlap AS (
  SELECT 
    os.occupation_id,
    COUNTIF(us.skill_id IS NOT NULL) / COUNT(*) AS overlap_score
  FROM `croute_market.occupation_skills` os
  LEFT JOIN user_skills us ON os.skill_id = us.skill_id
  WHERE os.period = '2024'
  GROUP BY os.occupation_id
),
-- Demand score per occupation
demand AS (
  SELECT occupation_id, AVG(demand_share) AS demand_score
  FROM `croute_market.market_demand`
  WHERE period = '2024'
  GROUP BY occupation_id
),
-- Velocity per occupation  
velocity AS (
  SELECT 
    occupation_id,
    SUM(share_2024 - share_2023) / COUNT(*) AS velocity_score
  FROM (
    SELECT 
      occupation_id,
      MAX(CASE WHEN period = '2024' THEN demand_share END) AS share_2024,
      MAX(CASE WHEN period = '2023' THEN demand_share END) AS share_2023
    FROM `croute_market.market_demand`
    GROUP BY occupation_id, skill_id
  )
  GROUP BY occupation_id
)
SELECT
  o.title,
  ROUND(
    (0.40 * so.overlap_score) +
    (0.25 * COALESCE(d.demand_score, 0)) +
    (0.15 * COALESCE(v.velocity_score, 0)),
  2) AS route_fit_score,
  so.overlap_score,
  d.demand_score
FROM skill_overlap so
JOIN `croute_market.occupations` o ON so.occupation_id = o.occupation_id
LEFT JOIN demand d ON so.occupation_id = d.occupation_id
LEFT JOIN velocity v ON so.occupation_id = v.occupation_id
ORDER BY route_fit_score DESC
LIMIT 5;