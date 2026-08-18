SELECT os.occupation_id, o.title, s.skill_name, os.importance
FROM `croute_market.occupation_skills` os
JOIN `croute_market.occupations` o ON os.occupation_id = o.occupation_id
JOIN `croute_market.skills` s ON os.skill_id = s.skill_id
WHERE os.occupation_id = 'OCC001'
ORDER BY os.importance DESC;