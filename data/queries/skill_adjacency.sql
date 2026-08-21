CREATE OR REPLACE VIEW `croute-hackathon.croute_market.v_skill_adjacency` AS
SELECT
  se.skill_a,
  sa.skill_name AS skill_a_name,
  se.skill_b,
  sb.skill_name AS skill_b_name,
  se.cooccurrence
FROM `croute-hackathon.croute_market.skill_edges` se
JOIN `croute-hackathon.croute_market.skills` sa ON se.skill_a = sa.skill_id
JOIN `croute-hackathon.croute_market.skills` sb ON se.skill_b = sb.skill_id
WHERE se.period = (SELECT MAX(period) FROM `croute-hackathon.croute_market.skill_edges`);