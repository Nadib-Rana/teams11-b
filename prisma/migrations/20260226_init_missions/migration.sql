-- CreateTime: 2026-02-26
-- Description: Initialize required missions for Ranking, Mission Workflow, and Push Notifications system

-- Daily Login Mission
INSERT INTO missions (id, title, slug, xp_reward, requirement_count, type)
VALUES (
  gen_random_uuid(),
  'Daily Login',
  'daily_login',
  10,
  1,
  'DAILY'
) ON CONFLICT (slug) DO NOTHING;

-- 3 Posts/Bubbles Mission
INSERT INTO missions (id, title, slug, xp_reward, requirement_count, type)
VALUES (
  gen_random_uuid(),
  'Create 3 Bubbles',
  'create_3_posts',
  30,
  3,
  'DAILY'
) ON CONFLICT (slug) DO NOTHING;

-- 3 Favorites Mission
INSERT INTO missions (id, title, slug, xp_reward, requirement_count, type)
VALUES (
  gen_random_uuid(),
  'Add 3 Favorites',
  'add_3_favorites',
  15,
  3,
  'DAILY'
) ON CONFLICT (slug) DO NOTHING;

-- 3 Responses Mission
INSERT INTO missions (id, title, slug, xp_reward, requirement_count, type)
VALUES (
  gen_random_uuid(),
  'Create 3 Responses',
  'add_3_responses',
  15,
  3,
  'DAILY'
) ON CONFLICT (slug) DO NOTHING;

-- 7-Day Streak Mission
INSERT INTO missions (id, title, slug, xp_reward, requirement_count, type)
VALUES (
  gen_random_uuid(),
  '7-Day Streak',
  '7_day_streak',
  50,
  1,
  'STREAK'
) ON CONFLICT (slug) DO NOTHING;

-- 15-Day Streak Mission
INSERT INTO missions (id, title, slug, xp_reward, requirement_count, type)
VALUES (
  gen_random_uuid(),
  '15-Day Streak',
  '15_day_streak',
  100,
  1,
  'STREAK'
) ON CONFLICT (slug) DO NOTHING;
