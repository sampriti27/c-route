CREATE OR REPLACE VIEW `croute-hackathon.croute_market.v_demand_velocity` AS
WITH periods AS (
  SELECT
    MAX(period) AS current_period,
    MIN(period) AS prev_period
  FROM `croute-hackathon.croute_market.market_demand`
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
FROM `croute-hackathon.croute_market.market_demand` d1
JOIN `croute-hackathon.croute_market.market_demand` d0
  ON  d1.occupation_id = d0.occupation_id
  AND d1.skill_id      = d0.skill_id
  AND d0.period = (SELECT prev_period FROM periods)
JOIN `croute-hackathon.croute_market.occupations` o ON d1.occupation_id = o.occupation_id
JOIN `croute-hackathon.croute_market.skills` s      ON d1.skill_id      = s.skill_id
WHERE d1.period = (SELECT current_period FROM periods);