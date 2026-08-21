-- top_skills_by_occ.sql
-- Returns top skills for a given occupation, ordered by importance
-- Replace 'OCC001' with the target occupation_id

SELECT 
  os.occupation_id,
  o.title,
  s.skill_name,
  s.category AS skill_category,
  os.importance
FROM `croute-hackathon.croute_market.occupation_skills` os
JOIN `croute-hackathon.croute_market.occupations` o ON os.occupation_id = o.occupation_id
JOIN `croute-hackathon.croute_market.skills` s ON os.skill_id = s.skill_id
WHERE os.occupation_id = 'OCC001'
  AND os.period = (SELECT MAX(period) FROM `croute-hackathon.croute_market.occupation_skills`)
ORDER BY os.importance DESC;