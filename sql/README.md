# SQL Migrations

This folder contains SQL migration files for the Pentagram database schema.

## Migration Files

- `001_initial_schema.sql` - Complete database schema (already applied)
- `002_create_profile_trigger.sql` - Trigger function to automatically create profiles when users sign up

## How to Apply Migrations

### Using Supabase MCP (Recommended)
Migrations can be applied using the Supabase MCP tools in Cursor.

### Using Supabase CLI
```bash
supabase db push
```

### Manual Application
Copy and paste the SQL from each migration file into the Supabase SQL Editor.

## Migration Order

Migrations should be applied in numerical order (001, 002, etc.).

