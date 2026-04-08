CREATE TABLE players (
  username TEXT PRIMARY KEY,
  auth_token TEXT NOT NULL UNIQUE,
  last_synced_at TIMESTAMPTZ
);

CREATE TABLE player_tasks (
  username TEXT NOT NULL REFERENCES players(username) ON DELETE CASCADE,
  task_id INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (username, task_id)
);

CREATE TABLE player_regions (
  username TEXT NOT NULL REFERENCES players(username) ON DELETE CASCADE,
  region TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (username, region)
);

CREATE INDEX idx_player_tasks_username ON player_tasks(username);

CREATE INDEX idx_player_regions_username ON player_regions(username);