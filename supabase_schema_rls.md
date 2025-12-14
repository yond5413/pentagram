# Supabase Schema & RLS Policies

This document defines the **database schema and Row Level Security (RLS) policies**
for the AI image generation + social platform.

---

## Extensions

```sql
create extension if not exists vector;
```

---

## Profiles

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Public profiles are viewable"
on profiles for select
using (true);

create policy "Users insert own profile"
on profiles for insert
with check (auth.uid() = id);

create policy "Users update own profile"
on profiles for update
using (auth.uid() = id);
```

---

## Images

```sql
create table images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  prompt text not null,
  negative_prompt text,
  model_name text not null,
  seed bigint,
  steps int,
  guidance_scale numeric,
  image_url text not null,
  thumbnail_url text,
  width int,
  height int,
  is_public boolean default true,
  is_deleted boolean default false,
  created_at timestamptz default now()
);

alter table images enable row level security;

create policy "Public images readable"
on images for select
using (is_public = true and is_deleted = false);

create policy "Users read own images"
on images for select
using (auth.uid() = user_id);

create policy "Users insert own images"
on images for insert
with check (auth.uid() = user_id);

create policy "Users update own images"
on images for update
using (auth.uid() = user_id);
```

---

## Prompt History

```sql
create table prompt_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  prompt text not null,
  created_at timestamptz default now()
);

alter table prompt_history enable row level security;

create policy "Users manage own prompts"
on prompt_history
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

---

## Likes

```sql
create table image_likes (
  user_id uuid references profiles(id) on delete cascade,
  image_id uuid references images(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, image_id)
);

alter table image_likes enable row level security;

create policy "Likes readable"
on image_likes for select
using (true);

create policy "Users manage own likes"
on image_likes for insert
with check (auth.uid() = user_id);

create policy "Users remove own likes"
on image_likes for delete
using (auth.uid() = user_id);
```

---

## Comments

```sql
create table comments (
  id uuid primary key default gen_random_uuid(),
  image_id uuid references images(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

alter table comments enable row level security;

create policy "Comments readable"
on comments for select
using (true);

create policy "Users insert comments"
on comments for insert
with check (auth.uid() = user_id);

create policy "Users update own comments"
on comments for update
using (auth.uid() = user_id);

create policy "Users delete own comments"
on comments for delete
using (auth.uid() = user_id);
```

---

## Follows

```sql
create table follows (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

alter table follows enable row level security;

create policy "Follows readable"
on follows for select
using (true);

create policy "Users manage own follows"
on follows for insert
with check (auth.uid() = follower_id);

create policy "Users unfollow"
on follows for delete
using (auth.uid() = follower_id);
```

---

## Embeddings (Semantic Search)

```sql
create table image_embeddings (
  image_id uuid primary key references images(id) on delete cascade,
  embedding vector(768),
  created_at timestamptz default now()
);

create index image_embeddings_idx
on image_embeddings
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

alter table image_embeddings enable row level security;

create policy "Public image embeddings readable"
on image_embeddings for select
using (
  exists (
    select 1 from images
    where images.id = image_embeddings.image_id
    and images.is_public = true
  )
);
```

---

## Moderation

```sql
create table moderation_scores (
  image_id uuid primary key references images(id) on delete cascade,
  nsfw_score numeric,
  violence_score numeric,
  hate_score numeric,
  created_at timestamptz default now()
);

create table moderation_flags (
  id uuid primary key default gen_random_uuid(),
  image_id uuid references images(id) on delete cascade,
  flagged_by uuid references profiles(id),
  reason text,
  created_at timestamptz default now()
);

alter table moderation_flags enable row level security;

create policy "Users flag content"
on moderation_flags for insert
with check (auth.uid() = flagged_by);
```

---

## User Interaction Events

```sql
create table user_image_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  image_id uuid references images(id) on delete cascade,
  event_type text check (event_type in ('view','like','comment','share')),
  created_at timestamptz default now()
);

alter table user_image_events enable row level security;

create policy "Users insert own events"
on user_image_events for insert
with check (auth.uid() = user_id);
```

---

## Feed Items

```sql
create table feed_items (
  user_id uuid references profiles(id) on delete cascade,
  image_id uuid references images(id) on delete cascade,
  score numeric not null,
  created_at timestamptz default now(),
  primary key (user_id, image_id)
);

alter table feed_items enable row level security;

create policy "Users read own feed"
on feed_items for select
using (auth.uid() = user_id);
```

---

## Generation Metrics (Service Role Only)

```sql
create table generation_metrics (
  image_id uuid references images(id) on delete cascade,
  latency_ms int,
  gpu_type text,
  cost_estimate numeric,
  created_at timestamptz default now()
);

alter table generation_metrics enable row level security;
```
