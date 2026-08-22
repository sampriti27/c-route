CREATE OR REPLACE VIEW `croute-hackathon.croute_market.v_demand_score` AS
WITH latest_demand AS (
  SELECT occupation_id, demand_count, demand_share
  FROM `croute-hackathon.croute_market.market_demand`
  WHERE period = (SELECT MAX(period) FROM `croute-hackathon.croute_market.market_demand`)
)
SELECT
  o.occupation_id,
  o.title,
  o.category,
  o.geography,
  COALESCE(SUM(ld.demand_count), 0)           AS total_demand,
  ROUND(COALESCE(AVG(ld.demand_share), 0.0), 4) AS avg_demand_share
FROM `croute-hackathon.croute_market.occupations` o
LEFT JOIN latest_demand ld
  ON o.occupation_id = ld.occupation_id
GROUP BY o.occupation_id, o.title, o.category, o.geography;