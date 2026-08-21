CREATE OR REPLACE VIEW `croute-hackathon.croute_market.v_demand_score` AS
SELECT
  o.occupation_id,
  o.title,
  o.category,
  o.geography,
  COALESCE(SUM(md.demand_count), 0)           AS total_demand,
  ROUND(COALESCE(AVG(md.demand_share), 0.0), 4) AS avg_demand_share
FROM `croute-hackathon.croute_market.occupations` o
LEFT JOIN `croute-hackathon.croute_market.market_demand` md
  ON o.occupation_id = md.occupation_id
  AND md.period = (SELECT MAX(period) FROM `croute-hackathon.croute_market.market_demand`)
GROUP BY o.occupation_id, o.title, o.category, o.geography;