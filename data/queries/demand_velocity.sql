SELECT
  occupation_id,
  skill_id,
  MAX(CASE WHEN period = '2024' THEN demand_share END) -
  MAX(CASE WHEN period = '2023' THEN demand_share END) AS demand_velocity
FROM `croute_market.market_demand`
GROUP BY occupation_id, skill_id;