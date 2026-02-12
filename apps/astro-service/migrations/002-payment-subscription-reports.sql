-- Run on astro_db. Migrations for payment, subscription, and premium reports.

-- Wallets
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" VARCHAR(255) NOT NULL UNIQUE,
  "balancePaise" BIGINT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets ("userId");

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" VARCHAR(255) NOT NULL,
  type VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  "amountPaise" BIGINT NOT NULL,
  "razorpayOrderId" VARCHAR(128),
  "razorpayPaymentId" VARCHAR(128),
  description VARCHAR(512),
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions ("userId");
CREATE INDEX IF NOT EXISTS idx_transactions_razorpay_order ON transactions ("razorpayOrderId");

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(64) NOT NULL,
  slug VARCHAR(32) NOT NULL UNIQUE,
  description TEXT,
  "pricePaise" BIGINT NOT NULL DEFAULT 0,
  "billingPeriod" VARCHAR(16) NOT NULL DEFAULT 'month',
  features VARCHAR(512) NOT NULL DEFAULT '',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" VARCHAR(255) NOT NULL,
  "planSlug" VARCHAR(64) NOT NULL,
  "startAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions ("userId");

-- Reports (premium PDFs)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" VARCHAR(255) NOT NULL,
  "reportType" VARCHAR(64) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  "filePath" VARCHAR(512) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports ("userId");

-- Seed default subscription plans (run once)
INSERT INTO subscription_plans (name, slug, description, "pricePaise", "billingPeriod", features, "isActive")
VALUES
  ('Free', 'free', 'Basic features', 0, 'month', '', true),
  ('Premium Monthly', 'premium_monthly', 'Premium reports, unlimited AI', 29900, 'month', 'premium_reports,ai_unlimited', true),
  ('Premium Yearly', 'premium_yearly', 'Premium reports, unlimited AI', 299000, 'year', 'premium_reports,ai_unlimited', true)
ON CONFLICT (slug) DO NOTHING;
