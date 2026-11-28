CREATE TABLE IF NOT EXISTS user_identities (
  provider TEXT NOT NULL,
  subject TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  PRIMARY KEY (provider, subject),
  UNIQUE (user_id, provider)
);
