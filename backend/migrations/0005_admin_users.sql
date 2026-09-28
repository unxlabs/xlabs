CREATE TABLE IF NOT EXISTS admin_users (
    user_id TEXT PRIMARY KEY,

    role TEXT NOT NULL DEFAULT 'admin'
        CHECK (role IN ('admin', 'super_admin')),

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'disabled')),

    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_admin_users_role
ON admin_users(role);

CREATE INDEX IF NOT EXISTS idx_admin_users_status
ON admin_users(status);