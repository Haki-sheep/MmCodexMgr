CREATE TABLE automation_runs (
            thread_id TEXT PRIMARY KEY,
            automation_id TEXT NOT NULL,
            status TEXT NOT NULL,
            read_at INTEGER,
            thread_title TEXT,
            source_cwd TEXT,
            inbox_title TEXT,
            inbox_summary TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          , archived_user_message TEXT, archived_assistant_message TEXT, archived_reason TEXT);
CREATE TABLE automations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            prompt TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            next_run_at INTEGER,
            last_run_at INTEGER,
            cwds TEXT NOT NULL DEFAULT '[]',
            rrule TEXT NOT NULL DEFAULT 'FREQ=HOURLY;INTERVAL=24;BYMINUTE=0',
            model TEXT,
            reasoning_effort TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          , target_type TEXT, project_id TEXT, kind TEXT NOT NULL DEFAULT 'cron', target_thread_id TEXT, execution_environment TEXT, local_environment_config_path TEXT, plugin_template_id TEXT, notification_policy TEXT, account_id TEXT, user_id TEXT, installation_id TEXT, legacy_automation_id TEXT, auto_archive INTEGER NOT NULL DEFAULT 0, next_run_nominal_at INTEGER);
CREATE TABLE codex_schema_migrations (
      id TEXT PRIMARY KEY,
      predecessor_id TEXT,
      checksum TEXT NOT NULL,
      applied_at INTEGER NOT NULL,
      app_version TEXT,
      build_flavor TEXT,
      build_commit TEXT
    );
CREATE TABLE inbox_items (
            id TEXT PRIMARY KEY,
            title TEXT
          , description TEXT, thread_id TEXT, read_at INTEGER, created_at INTEGER);
CREATE TABLE live_visualization_suggestions (
          account_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          host_id TEXT NOT NULL,
          thread_id TEXT NOT NULL,
          id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'dismissed')),
          submission TEXT CHECK (submission IN ('submitted', 'accepted')),
          PRIMARY KEY (account_id, user_id, host_id, thread_id)
        ) WITHOUT ROWID;
CREATE TABLE local_app_server_feature_enablement (
            feature_name TEXT PRIMARY KEY,
            enabled INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
          );
CREATE TABLE "local_thread_catalog" (
            host_id TEXT NOT NULL,
            thread_id TEXT NOT NULL,
            display_title TEXT NOT NULL,
            source_created_at REAL NOT NULL,
            source_updated_at REAL NOT NULL,
            cwd TEXT,
            source_kind TEXT NOT NULL,
            source_detail TEXT,
            model_provider TEXT,
            git_branch TEXT,
            observation_sequence INTEGER NOT NULL,
            missing_candidate INTEGER NOT NULL DEFAULT 0
              CHECK (missing_candidate IN (0, 1)),
            thread_source TEXT,
            source_recency_at REAL NOT NULL DEFAULT 0,
            pending_observed_title INTEGER NOT NULL DEFAULT 0,
            project_id TEXT,
            conversation_origin TEXT, trial_conversation_type TEXT, chatgpt_async_status INTEGER,
            PRIMARY KEY (host_id, thread_id)
          );
CREATE TABLE "local_thread_catalog_hosts" (
            host_id TEXT PRIMARY KEY,
            host_kind TEXT NOT NULL CHECK (
              host_kind IN ('local', 'ssh', 'wsl', 'remote-control', 'chatgpt')
            )
          );
CREATE TABLE local_thread_catalog_metadata (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            catalog_revision INTEGER NOT NULL DEFAULT 0
          );
CREATE TABLE local_thread_catalog_scan_checkpoints (
          host_id TEXT PRIMARY KEY,
          checkpoint TEXT NOT NULL,
          failed_at INTEGER
        );
CREATE TABLE local_thread_catalog_scan_entries (
          host_id TEXT NOT NULL,
          thread_id TEXT NOT NULL,
          removed INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (host_id, thread_id)
        ) WITHOUT ROWID;
CREATE TABLE local_thread_catalog_sync_state (
            host_id TEXT PRIMARY KEY,
            watermark_updated_at REAL,
            initial_build_complete INTEGER NOT NULL DEFAULT 0,
            observation_sequence INTEGER NOT NULL DEFAULT 0
          , last_full_reconciled_at INTEGER);
CREATE TABLE thread_timeline_ledger (
            host_id TEXT NOT NULL,
            thread_id TEXT NOT NULL,
            sequence INTEGER NOT NULL,
            record_id TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            PRIMARY KEY (host_id, thread_id, sequence),
            UNIQUE (host_id, thread_id, record_id)
          ) WITHOUT ROWID;
CREATE INDEX automations_owner_idx
            ON automations (account_id, user_id, installation_id);
CREATE INDEX local_thread_catalog_created_idx
            ON local_thread_catalog (
              host_id, source_created_at DESC, source_updated_at DESC, thread_id
            ) WHERE missing_candidate = 0;
CREATE INDEX local_thread_catalog_cwd_created_idx
            ON local_thread_catalog (
              host_id, cwd, source_created_at DESC, source_updated_at DESC,
              thread_id
            ) WHERE missing_candidate = 0;
CREATE INDEX local_thread_catalog_cwd_updated_idx
            ON local_thread_catalog (
              host_id, cwd, source_recency_at DESC, source_created_at DESC,
              thread_id
            ) WHERE missing_candidate = 0;
CREATE INDEX local_thread_catalog_origin_updated_idx
            ON local_thread_catalog (
              host_id, conversation_origin, source_recency_at DESC,
              source_created_at DESC, thread_id
            ) WHERE missing_candidate = 0;
CREATE INDEX local_thread_catalog_project_updated_idx
            ON local_thread_catalog (
              host_id, project_id, source_recency_at DESC,
              source_created_at DESC, thread_id
            ) WHERE missing_candidate = 0;
CREATE INDEX local_thread_catalog_thread_lookup_idx
            ON local_thread_catalog (
              thread_id, source_recency_at DESC, source_created_at DESC, host_id
            ) WHERE missing_candidate = 0;
CREATE INDEX local_thread_catalog_updated_idx
            ON local_thread_catalog (
              host_id, source_recency_at DESC, source_created_at DESC, thread_id
            ) WHERE missing_candidate = 0;
