-- Migration: Add parent_comment_id to comments table for nested replies
-- This enables unlimited nesting depth for comment replies

-- Add parent_comment_id column to comments table
alter table comments
add column if not exists parent_comment_id uuid references comments(id) on delete cascade;

-- Create index on parent_comment_id for better query performance
create index if not exists idx_comments_parent_comment_id
on comments(parent_comment_id);

-- Create index on image_id and parent_comment_id for efficient hierarchical queries
create index if not exists idx_comments_image_parent
on comments(image_id, parent_comment_id)
where parent_comment_id is null; -- For top-level comments

