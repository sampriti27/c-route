CREATE OR REPLACE VIEW `croute-hackathon.croute_market.v_demand_velocity` AS
WITH periods AS (
  SELECT
    MAX(period) AS current_period,
    MIN(period) AS prev_period
  FROM `croute-hackathon.croute_market.market_demand`
),
current_demand_data AS (
  SELECT *
  FROM `croute-hackathon.croute_market.market_demand`
  WHERE period = (SELECT current_period FROM periods)
),
prev_demand_data AS (
  SELECT *
  FROM `croute-hackathon.croute_market.market_demand`
  WHERE period = (SELECT prev_period FROM periods)
)
SELECT
  d1.occupation_id,
  o.title,
  d1.skill_id,
  s.skill_name,
  d1.demand_count AS current_demand,
  d0.demand_count AS prev_demand,
  ROUND(
    SAFE_DIVIDE(d1.demand_count - d0.demand_count, d0.demand_count) * 100,
    2
  ) AS velocity_pct
FROM current_demand_data d1
JOIN prev_demand_data d0
  ON  d1.occupation_id = d0.occupation_id
  AND d1.skill_id      = d0.skill_id
JOIN `croute-hackathon.croute_market.occupations` o ON d1.occupation_id = o.occupation_id
JOIN `croute-hackathon.croute_market.skills` s      ON d1.skill_id      = s.skill_id;