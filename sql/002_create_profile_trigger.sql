-- Create Profile Trigger Migration
-- This migration creates a trigger function that automatically creates a profile
-- when a new user signs up in auth.users

-- Function to handle automatic profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  -- Extract username from user metadata
  -- The username is stored in raw_user_meta_data->>'username' during signup
  v_username := new.raw_user_meta_data->>'username';
  
  -- If username is not provided, generate a fallback username
  -- This should rarely happen as the app validates username before signup
  if v_username is null or trim(v_username) = '' then
    -- Generate a fallback username using user ID (first 8 chars)
    v_username := 'user_' || substring(new.id::text from 1 for 8);
  end if;
  
  -- Trim whitespace from username
  v_username := trim(v_username);
  
  -- Insert profile for the new user
  -- Using SECURITY DEFINER allows bypassing RLS policies
  insert into public.profiles (id, username)
  values (new.id, v_username)
  on conflict (id) do nothing; -- Prevent errors if profile already exists
  
  return new;
end;
$$;

-- Create trigger that fires after a new user is inserted into auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Grant necessary permissions
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on public.profiles to postgres, anon, authenticated, service_role;

