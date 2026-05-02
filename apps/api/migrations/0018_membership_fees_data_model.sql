ALTER TABLE users
  ADD COLUMN account_status TEXT NOT NULL DEFAULT 'active'
  CHECK (account_status IN ('active', 'blocked', 'deactivated', 'invited', 'not_invited'));

UPDATE users
SET account_status = CASE status
  WHEN 'active' THEN 'active'
  WHEN 'suspended' THEN 'blocked'
  WHEN 'invited' THEN 'invited'
  WHEN 'not_invited' THEN 'not_invited'
  ELSE 'active'
END;

CREATE INDEX IF NOT EXISTS idx_users_account_status
  ON users (account_status, id);

ALTER TABLE member_profiles ADD COLUMN business_title TEXT;
ALTER TABLE member_profiles ADD COLUMN business_details TEXT;
ALTER TABLE member_profiles ADD COLUMN iwfsa_position TEXT;
ALTER TABLE member_profiles ADD COLUMN bio TEXT
  CHECK (bio IS NULL OR length(trim(bio)) <= 300);
ALTER TABLE member_profiles ADD COLUMN linkedin_url TEXT;
ALTER TABLE member_profiles ADD COLUMN professional_links_json TEXT;
ALTER TABLE member_profiles ADD COLUMN contact_details_json TEXT;
ALTER TABLE member_profiles ADD COLUMN expertise_tags_json TEXT;
ALTER TABLE member_profiles ADD COLUMN expertise_free_text TEXT;
ALTER TABLE member_profiles ADD COLUMN profile_confirmed_at TEXT;

CREATE INDEX IF NOT EXISTS idx_member_profiles_profile_confirmed
  ON member_profiles (profile_confirmed_at);

CREATE TABLE IF NOT EXISTS membership_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_membership_categories_single_default
  ON membership_categories (is_default)
  WHERE is_default = 1;

CREATE TABLE IF NOT EXISTS member_category_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  membership_category_id INTEGER NOT NULL,
  starts_at TEXT,
  ends_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (membership_category_id) REFERENCES membership_categories(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_member_category_assignments_single_active
  ON member_category_assignments (user_id)
  WHERE ends_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_member_category_assignments_category_active
  ON member_category_assignments (membership_category_id, ends_at, user_id);

CREATE TABLE IF NOT EXISTS membership_cycles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  membership_year INTEGER NOT NULL UNIQUE CHECK (membership_year BETWEEN 2000 AND 2100),
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_membership_cycles_status_year
  ON membership_cycles (status, membership_year DESC);

CREATE TABLE IF NOT EXISTS member_fee_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  membership_cycle_id INTEGER NOT NULL,
  amount_due REAL NOT NULL DEFAULT 0 CHECK (amount_due >= 0),
  amount_paid REAL NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  balance REAL NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (payment_status IN ('paid', 'outstanding', 'partial', 'waived', 'pending_review')),
  standing_status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (standing_status IN ('good_standing', 'outstanding', 'partial', 'waived', 'pending_review', 'blocked', 'deactivated')),
  access_status TEXT NOT NULL DEFAULT 'enabled'
    CHECK (access_status IN ('enabled', 'blocked', 'deactivated')),
  last_payment_at TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  admin_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, membership_cycle_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (membership_cycle_id) REFERENCES membership_cycles(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_member_fee_accounts_cycle_standing
  ON member_fee_accounts (membership_cycle_id, standing_status, access_status);

CREATE INDEX IF NOT EXISTS idx_member_fee_accounts_user_cycle
  ON member_fee_accounts (user_id, membership_cycle_id);

CREATE TABLE IF NOT EXISTS member_fee_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_fee_account_id INTEGER NOT NULL,
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN ('payment', 'waiver', 'credit', 'adjustment', 'reversal')),
  amount REAL NOT NULL CHECK (amount <> 0),
  reference_text TEXT,
  notes TEXT,
  recorded_by_user_id INTEGER NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_fee_account_id) REFERENCES member_fee_accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_member_fee_transactions_account_recorded
  ON member_fee_transactions (member_fee_account_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS member_standing_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  membership_cycle_id INTEGER NOT NULL,
  previous_payment_status TEXT
    CHECK (previous_payment_status IS NULL OR previous_payment_status IN ('paid', 'outstanding', 'partial', 'waived', 'pending_review')),
  next_payment_status TEXT NOT NULL
    CHECK (next_payment_status IN ('paid', 'outstanding', 'partial', 'waived', 'pending_review')),
  previous_standing_status TEXT
    CHECK (previous_standing_status IS NULL OR previous_standing_status IN ('good_standing', 'outstanding', 'partial', 'waived', 'pending_review', 'blocked', 'deactivated')),
  next_standing_status TEXT NOT NULL
    CHECK (next_standing_status IN ('good_standing', 'outstanding', 'partial', 'waived', 'pending_review', 'blocked', 'deactivated')),
  previous_access_status TEXT
    CHECK (previous_access_status IS NULL OR previous_access_status IN ('enabled', 'blocked', 'deactivated')),
  next_access_status TEXT NOT NULL
    CHECK (next_access_status IN ('enabled', 'blocked', 'deactivated')),
  reason TEXT,
  actor_user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (membership_cycle_id) REFERENCES membership_cycles(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_member_standing_audit_user_created
  ON member_standing_audit (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_member_standing_audit_cycle_created
  ON member_standing_audit (membership_cycle_id, created_at DESC);

ALTER TABLE member_import_batches ADD COLUMN membership_cycle_year INTEGER;
ALTER TABLE member_import_batches ADD COLUMN membership_category_default TEXT NOT NULL DEFAULT 'Active Member';
ALTER TABLE member_import_batches ADD COLUMN standing_default TEXT NOT NULL DEFAULT 'pending_review'
  CHECK (standing_default IN ('good_standing', 'outstanding', 'partial', 'waived', 'pending_review', 'blocked', 'deactivated'));

INSERT OR IGNORE INTO membership_categories (name, is_default, is_active)
VALUES
  ('Active Member', 1, 1),
  ('Honourary Member', 0, 1),
  ('Board of Directors', 0, 1),
  ('Advocacy and Voice Committee Member', 0, 1),
  ('Catalytic Strategy Member', 0, 1),
  ('Leadership Development Committee Member', 0, 1),
  ('Member Affairs Committee Member', 0, 1),
  ('Brand and Reputation Committee Member', 0, 1);
