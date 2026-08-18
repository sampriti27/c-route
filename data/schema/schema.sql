CREATE TABLE `croute_market.occupations` (
  occupation_id STRING,
  title STRING,
  category STRING,
  geography STRING
);

CREATE TABLE `croute_market.skills` (
  skill_id STRING,
  skill_name STRING,
  category STRING
);

CREATE TABLE `croute_market.occupation_skills` (
  occupation_id STRING,
  skill_id STRING,
  importance FLOAT64,
  period STRING
);

CREATE TABLE `croute_market.market_demand` (
  occupation_id STRING,
  skill_id STRING,
  period STRING,
  demand_count INT64,
  demand_share FLOAT64,
  source STRING
);

CREATE TABLE `croute_market.skill_edges` (
  skill_a STRING,
  skill_b STRING,
  cooccurrence FLOAT64,
  period STRING
);