SELECT 
  occupation_id,
  skill_id,
  AVG(demand_share) as demand_score
FROM `croute_market.market_demand`
GROUP BY occupation_id, skill_id;