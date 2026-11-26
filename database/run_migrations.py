#!/usr/bin/env python3
"""
Database Migration Runner for AI-Powered CRM & Outreach Platform.
Applies database/migrations/*.sql in sequential order with checksum tracking.
Zero ORM - Pure parameterised SQL using psycopg.
"""

import os
import sys
import hashlib
import argparse
from pathlib import Path
import psycopg

MIGRATIONS_DIR = Path(__file__).parent / "migrations"
SEEDS_DIR = Path(__file__).parent / "seeds"

def compute_checksum(content: str) -> str:
    """Compute SHA-256 checksum of SQL file content."""
    return hashlib.sha256(content.strip().encode("utf-8")).hexdigest()


def strip_transaction_wrappers(content: str) -> str:
    """Remove outer SQL transactions so the runner can manage them."""
    lines = content.splitlines()
    begin_index = next(
        (
            index
            for index, line in enumerate(lines)
            if line.strip().upper() in {"BEGIN", "BEGIN;"}
        ),
        None,
    )
    commit_index = next(
        (
            index
            for index in range(len(lines) - 1, -1, -1)
            if lines[index].strip().upper() in {"COMMIT", "COMMIT;"}
        ),
        None,
    )

    if begin_index is None and commit_index is None:
        return content
    if begin_index is None or commit_index is None or begin_index >= commit_index:
        raise ValueError("SQL file has an incomplete outer transaction wrapper")

    unwrapped_lines = (
        lines[:begin_index]
        + lines[begin_index + 1:commit_index]
        + lines[commit_index + 1:]
    )
    return "\n".join(unwrapped_lines)


def ensure_migration_table(conn):
    """Ensures schema_migrations table exists."""
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version VARCHAR(255) PRIMARY KEY,
                checksum VARCHAR(64) NOT NULL,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
            );
        """)
    conn.commit()

def run_migrations(database_url: str, dry_run: bool = False, run_seed: bool = False):
    print(f"Connecting to database...")
    try:
        with psycopg.connect(database_url) as conn:
            ensure_migration_table(conn)

            # Fetch applied migrations
            with conn.cursor() as cur:
                cur.execute("SELECT version, checksum FROM schema_migrations ORDER BY version ASC;")
                applied = dict(cur.fetchall())

            # Find all migration files
            migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
            if not migration_files:
                print("No migration files found in database/migrations/")
                return

            print(f"Found {len(migration_files)} migration files.")
            pending = []

            for file_path in migration_files:
                version = file_path.name
                content = file_path.read_text(encoding="utf-8")
                checksum = compute_checksum(content)

                if version in applied:
                    if applied[version] != checksum:
                        raise ValueError(
                            f"CRITICAL: Checksum mismatch on already-applied migration {version}! "
                            f"Expected {applied[version]}, found {checksum}. Do not edit applied migrations!"
                        )
                else:
                    pending.append((version, file_path, checksum, content))

            if not pending:
                print("Database is up to date! No pending migrations.")
            else:
                print(f"Pending migrations ({len(pending)}):")
                for version, _, _, _ in pending:
                    print(f"  - {version}")

                if dry_run:
                    print("\n[DRY RUN] Skipping application of pending migrations.")
                    return

                print("\nApplying pending migrations:")
                for version, file_path, checksum, content in pending:
                    print(f"  Applying {version}...", end="", flush=True)
                    with conn.transaction():
                        with conn.cursor() as cur:
                            cur.execute(strip_transaction_wrappers(content))
                            cur.execute(
                                "INSERT INTO schema_migrations (version, checksum) VALUES (%s, %s);",
                                (version, checksum)
                            )
                    print(" DONE")

                print("\nAll pending migrations applied successfully!")

            if run_seed:
                seed_files = sorted(SEEDS_DIR.glob("*.sql"))
                print(f"\nApplying seed files ({len(seed_files)})...")
                for seed_path in seed_files:
                    print(f"  Executing seed: {seed_path.name}...", end="", flush=True)
                    if not dry_run:
                        content = seed_path.read_text(encoding="utf-8")
                        with conn.transaction():
                            with conn.cursor() as cur:
                                cur.execute(strip_transaction_wrappers(content))
                    print(" DONE")

    except Exception as e:
        print(f"\nERROR running migrations: {e}", file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Run PostgreSQL raw SQL migrations.")
    parser.add_argument("--dry-run", action="store_true", help="Inspect pending migrations without executing.")
    parser.add_argument("--seed", action="store_true", help="Execute database/seeds/*.sql after migrations.")
    parser.add_argument("--db-url", type=str, default=None, help="Database connection URL override.")
    args = parser.parse_args()

    database_url = args.db_url or os.getenv("DATABASE_URL")
    if not database_url:
        print("Error: DATABASE_URL environment variable is not set and --db-url not provided.", file=sys.stderr)
        sys.exit(1)

    run_migrations(database_url=database_url, dry_run=args.dry_run, run_seed=args.seed)

if __name__ == "__main__":
    main()
