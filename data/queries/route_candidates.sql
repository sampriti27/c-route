-- route_scoring.sql
-- Route Fit scoring query for C.Route
-- Formula: 0.40×skill_overlap + 0.25×market_demand + 0.15×demand_velocity
-- Note: skill_adjacency (0.10) and gap_penalty (0.10) to be added in Python scoring engine

-- Aisha's current skills (replace with dynamic user input in Python)
WITH user_skills AS (
  SELECT skill_id 
  FROM `croute-hackathon.croute_market.skills`
  WHERE skill_name IN ('Excel', 'Finance Basics', 'Communication', 'PowerPoint')
),

-- Skill overlap per occupation
skill_overlap AS (
  SELECT 
    os.occupation_id,
    COUNTIF(us.skill_id IS NOT NULL) / COUNT(*) AS overlap_score
  FROM `croute-hackathon.croute_market.occupation_skills` os
  LEFT JOIN user_skills us ON os.skill_id = us.skill_id
  WHERE os.period = (SELECT MAX(period) FROM `croute-hackathon.croute_market.occupation_skills`)
  GROUP BY os.occupation_id
),

-- Demand score per occupation (latest period)
demand AS (
  SELECT 
    occupation_id, 
    AVG(demand_share) AS demand_score
  FROM `croute-hackathon.croute_market.market_demand`
  WHERE period = (SELECT MAX(period) FROM `croute-hackathon.croute_market.market_demand`)
  GROUP BY occupation_id
),

-- Velocity per occupation (latest vs previous period)
velocity AS (
  SELECT 
    occupation_id,
    SUM(share_current - share_prev) / COUNT(*) AS velocity_score
  FROM (
    SELECT 
      occupation_id,
      skill_id,
      MAX(CASE WHEN period = (SELECT MAX(period) FROM `croute-hackathon.croute_market.market_demand`) 
          THEN demand_share END) AS share_current,
      MAX(CASE WHEN period = (SELECT MIN(period) FROM `croute-hackathon.croute_market.market_demand`) 
          THEN demand_share END) AS share_prev
    FROM `croute-hackathon.croute_market.market_demand`
    GROUP BY occupation_id, skill_id
  )
  GROUP BY occupation_id
)

SELECT
  o.occupation_id,
  o.title,
  o.category,
  ROUND(
    (0.40 * so.overlap_score) +
    (0.25 * COALESCE(d.demand_score, 0)) +
    (0.15 * COALESCE(v.velocity_score, 0)),
  4) AS route_fit_score,
  ROUND(so.overlap_score, 4)        AS skill_overlap,
  ROUND(COALESCE(d.demand_score, 0), 4)  AS demand_score,
  ROUND(COALESCE(v.velocity_score, 0), 4) AS velocity_score
FROM skill_overlap so
JOIN `croute-hackathon.croute_market.occupations` o ON so.occupation_id = o.occupation_id
LEFT JOIN demand d ON so.occupation_id = d.occupation_id
LEFT JOIN velocity v ON so.occupation_id = v.occupation_id
ORDER BY route_fit_score DESC
LIMIT 5;