/*
  # Seed Data for Guided Journeys

  ## Overview
  Sample journeys and steps for testing and demonstration purposes

  ## Sample Journeys Created
  1. Morning Mastery - Beginner morning routine building
  2. Mindful Living - Intermediate mindfulness journey
  3. Peak Performance - Advanced productivity program
  4. Fitness Foundation - Beginner fitness journey
  5. Digital Detox - Intermediate digital wellbeing program
*/

-- Insert sample journeys
INSERT INTO journeys (
  title,
  description,
  category,
  difficulty_level,
  estimated_duration_days,
  is_premium,
  coach_led,
  total_steps,
  popularity_score,
  is_published
) VALUES
(
  'Morning Mastery',
  'Build a transformative morning routine that sets you up for success every single day. Learn the science of habit formation and create lasting change.',
  'productivity',
  'beginner',
  21,
  false,
  false,
  7,
  950,
  true
),
(
  'Mindful Living',
  'Discover the power of mindfulness to reduce stress, increase focus, and find peace in everyday moments. Includes guided meditations and practical exercises.',
  'mindfulness',
  'intermediate',
  30,
  true,
  true,
  10,
  1250,
  true
),
(
  'Peak Performance',
  'Master advanced productivity techniques used by top performers. Deep work, time blocking, energy management, and more.',
  'productivity',
  'advanced',
  45,
  true,
  true,
  15,
  800,
  true
),
(
  'Fitness Foundation',
  'Start your fitness journey with confidence. Learn proper form, build consistency, and create a sustainable exercise habit.',
  'fitness',
  'beginner',
  28,
  false,
  false,
  14,
  1100,
  true
),
(
  'Digital Detox',
  'Reclaim your time and attention from digital distractions. Build healthy boundaries with technology and improve your focus.',
  'mindfulness',
  'intermediate',
  14,
  false,
  false,
  7,
  720,
  true
),
(
  'Nutrition Fundamentals',
  'Learn the basics of healthy eating without restrictive diets. Build sustainable habits for long-term health and energy.',
  'nutrition',
  'beginner',
  30,
  false,
  false,
  10,
  890,
  true
);

-- Insert steps for Morning Mastery journey
INSERT INTO journey_steps (
  journey_id,
  step_number,
  title,
  description,
  step_type,
  content_type,
  estimated_minutes,
  is_required,
  unlock_after_days,
  points_reward
)
SELECT
  j.id,
  s.step_number,
  s.title,
  s.description,
  s.step_type,
  s.content_type,
  s.estimated_minutes,
  s.is_required,
  s.unlock_after_days,
  s.points_reward
FROM journeys j
CROSS JOIN (
  VALUES
    (1, 'Why Mornings Matter', 'Discover the science behind morning routines and why they are so powerful for success.', 'lesson', 'video', 15, true, 0, 10),
    (2, 'Design Your Ideal Morning', 'Learn how to craft a morning routine that fits your lifestyle and goals.', 'exercise', 'interactive', 20, true, 1, 15),
    (3, 'The Power of Wake-Up Time', 'Establish a consistent wake-up time and understand sleep cycle optimization.', 'lesson', 'text', 10, true, 3, 10),
    (4, 'Movement & Energy', 'Add energizing movement to your morning to boost physical and mental performance.', 'exercise', 'video', 15, true, 5, 15),
    (5, 'Mindful Minutes', 'Incorporate meditation or journaling to center yourself before the day begins.', 'reflection', 'audio', 10, true, 7, 10),
    (6, 'Nutrition for Success', 'Build a healthy breakfast routine that fuels your body and brain.', 'lesson', 'text', 12, true, 10, 10),
    (7, 'Make It Stick', 'Implementation strategies to maintain your morning routine long-term.', 'challenge', 'interactive', 25, true, 14, 20)
) AS s(step_number, title, description, step_type, content_type, estimated_minutes, is_required, unlock_after_days, points_reward)
WHERE j.title = 'Morning Mastery';

-- Insert steps for Digital Detox journey
INSERT INTO journey_steps (
  journey_id,
  step_number,
  title,
  description,
  step_type,
  content_type,
  estimated_minutes,
  is_required,
  unlock_after_days,
  points_reward
)
SELECT
  j.id,
  s.step_number,
  s.title,
  s.description,
  s.step_type,
  s.content_type,
  s.estimated_minutes,
  s.is_required,
  s.unlock_after_days,
  s.points_reward
FROM journeys j
CROSS JOIN (
  VALUES
    (1, 'Understanding Digital Overwhelm', 'Recognize the impact of constant connectivity on your wellbeing.', 'lesson', 'video', 12, true, 0, 10),
    (2, 'Track Your Usage', 'Become aware of your current digital habits through mindful tracking.', 'exercise', 'interactive', 10, true, 1, 10),
    (3, 'Set Boundaries', 'Create clear rules for when and how you use technology.', 'exercise', 'text', 15, true, 2, 15),
    (4, 'Phone-Free Zones', 'Designate specific areas and times without devices.', 'challenge', 'text', 10, true, 4, 15),
    (5, 'Notification Audit', 'Eliminate unnecessary notifications and reclaim your attention.', 'exercise', 'interactive', 20, true, 6, 15),
    (6, 'Analog Alternatives', 'Rediscover offline activities that bring you joy and fulfillment.', 'reflection', 'text', 15, true, 8, 10),
    (7, 'Sustainable Balance', 'Build a healthy long-term relationship with technology.', 'lesson', 'video', 18, true, 12, 20)
) AS s(step_number, title, description, step_type, content_type, estimated_minutes, is_required, unlock_after_days, points_reward)
WHERE j.title = 'Digital Detox';

-- Insert steps for Fitness Foundation journey
INSERT INTO journey_steps (
  journey_id,
  step_number,
  title,
  description,
  step_type,
  content_type,
  estimated_minutes,
  is_required,
  unlock_after_days,
  points_reward
)
SELECT
  j.id,
  s.step_number,
  s.title,
  s.description,
  s.step_type,
  s.content_type,
  s.estimated_minutes,
  s.is_required,
  s.unlock_after_days,
  s.points_reward
FROM journeys j
CROSS JOIN (
  VALUES
    (1, 'Starting Your Fitness Journey', 'Set realistic goals and understand the fundamentals of exercise.', 'lesson', 'video', 15, true, 0, 10),
    (2, 'Movement Basics', 'Learn fundamental movement patterns and proper form.', 'exercise', 'video', 20, true, 2, 15),
    (3, 'Building Consistency', 'Strategies to make exercise a regular habit.', 'lesson', 'text', 12, true, 4, 10),
    (4, 'Bodyweight Training', 'Effective exercises you can do anywhere, no equipment needed.', 'exercise', 'video', 25, true, 6, 15),
    (5, 'Cardio Fundamentals', 'Introduction to cardiovascular exercise and heart health.', 'lesson', 'video', 15, true, 8, 10),
    (6, 'Recovery & Rest', 'The importance of rest days and recovery techniques.', 'lesson', 'text', 10, true, 10, 10),
    (7, 'Week 2 Workout A', 'Full-body beginner workout routine.', 'exercise', 'video', 30, true, 12, 20),
    (8, 'Week 2 Workout B', 'Lower body focus workout.', 'exercise', 'video', 25, true, 14, 20),
    (9, 'Flexibility & Mobility', 'Stretching routines to improve range of motion.', 'exercise', 'video', 20, true, 16, 15),
    (10, 'Week 3 Challenge', 'Test your progress with a benchmark workout.', 'challenge', 'interactive', 30, true, 18, 25),
    (11, 'Nutrition for Fitness', 'Fuel your body properly to support your training.', 'lesson', 'text', 15, true, 20, 10),
    (12, 'Week 4 Workout A', 'Advanced beginner full-body workout.', 'exercise', 'video', 35, true, 22, 20),
    (13, 'Week 4 Workout B', 'Upper body strength training.', 'exercise', 'video', 30, true, 24, 20),
    (14, 'Your Fitness Future', 'Plan your next steps and maintain momentum.', 'reflection', 'text', 20, true, 26, 25)
) AS s(step_number, title, description, step_type, content_type, estimated_minutes, is_required, unlock_after_days, points_reward)
WHERE j.title = 'Fitness Foundation';