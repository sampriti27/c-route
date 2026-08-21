CREATE OR REPLACE VIEW `croute-hackathon.croute_market.v_demand_score` AS
SELECT
  o.occupation_id,
  o.title,
  o.category,
  o.geography,
  SUM(md.demand_count)           AS total_demand,
  ROUND(AVG(md.demand_share), 4) AS avg_demand_share
FROM `croute-hackathon.croute_market.market_demand` md
JOIN `croute-hackathon.croute_market.occupations` o ON md.occupation_id = o.occupation_id
WHERE md.period = (SELECT MAX(period) FROM `croute-hackathon.croute_market.market_demand`)
GROUP BY o.occupation_id, o.title, o.category, o.geography;