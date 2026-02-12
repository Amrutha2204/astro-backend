-- Run this on astro_db if synchronize is false (e.g. production).
-- Table for notification preferences and device tokens (push).

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" VARCHAR(255) NOT NULL UNIQUE,
  "dailyHoroscopeEnabled" BOOLEAN NOT NULL DEFAULT false,
  "preferredTime" VARCHAR(5) NOT NULL DEFAULT '09:00',
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
  "deviceToken" VARCHAR(512),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id
  ON notification_preferences ("userId");
CREATE INDEX IF NOT EXISTS idx_notification_preferences_daily_enabled
  ON notification_preferences ("dailyHoroscopeEnabled") WHERE "dailyHoroscopeEnabled" = true;
