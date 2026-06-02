DROP TABLE IF EXISTS summary CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS message_role CASCADE;
DROP TYPE IF EXISTS user_plan CASCADE;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_plan AS ENUM ('FREE', 'PRO');
CREATE TYPE message_role AS ENUM ('user', 'assistant');

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  "imageUrl" TEXT,
  "razorpayCustomerId" TEXT,
  "razorpaySubscriptionId" TEXT,
  "subscriptionStatus" TEXT,
  plans user_plan NOT NULL DEFAULT 'FREE',
  "messageCount" INTEGER NOT NULL DEFAULT 0,
  "lastMessageDate" DATE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES users ("userId") ON DELETE CASCADE,
  role message_role NOT NULL,
  message TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX messages_user_created_idx ON messages ("userId", "createdAt" DESC);

CREATE TABLE summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES users ("userId") ON DELETE CASCADE,
  summary TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX summary_user_created_idx ON summary ("userId", "createdAt" DESC);
