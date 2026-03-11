# Plutus — Database

PostgreSQL hosted on Supabase. All schema changes live here as numbered SQL files.

## How to apply a migration

1. Open the Supabase SQL Editor:
   `https://supabase.com/dashboard/project/muhxmmhczhxdzcruxsoi/sql/new`
2. Open the `.sql` file, copy all, paste into the editor
3. Click **RUN**
4. Commit the file to Git

## How to create a new migration

1. Create a new file in `migrations/` following the naming pattern:
   ```
   002_add_bank_accounts.sql
   003_add_notifications.sql
   ```
2. Write the SQL (always use `IF NOT EXISTS` / `IF EXISTS` to make it safe to re-run)
3. Apply it in the Supabase SQL Editor
4. Commit to Git with a clear message:
   ```
   git commit -m "db: add bank accounts table"
   ```

## Rules

- Never edit an already-applied migration — create a new one instead
- One migration per change (don't bundle unrelated changes)
- Always test in the SQL Editor before committing

## Migration history

| File | Description | Applied |
|------|-------------|---------|
| `001_initial_schema.sql` | All tables, RLS, indexes, default categories | 2026-03-11 |
