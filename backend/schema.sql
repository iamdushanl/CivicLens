-- CivicLens Supabase Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID generation
create extension if not exists pgcrypto;

-- Issues table
create table if not exists public.issues (
  id text primary key,
  title text not null,
  description text not null,
  category text not null check (category in ('potholes','streetLights','garbage','waterSupply','roadDamage','drainage','publicSafety','other')),
  severity text not null check (severity in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','in-progress','resolved')),
  location text not null,
  lat double precision,
  lng double precision,
  photos jsonb not null default '[]'::jsonb,
  upvotes integer not null default 0,
  comment_count integer not null default 0,
  reporter text not null default 'Anonymous',
  is_anonymous boolean not null default true,
  created_at timestamptz not null default now(),
  ai_confidence integer,
  ai_category text,
  severity_score integer,
  severity_text text,
  resolution_confirmations integer not null default 0,
  resolved_at timestamptz,
  resolved_by text check (resolved_by in ('community','reporter','official')),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_issues_status on public.issues(status);
create index if not exists idx_issues_created_at on public.issues(created_at desc);
create index if not exists idx_issues_category on public.issues(category);

-- Issue votes table
create table if not exists public.issue_votes (
  id uuid primary key default gen_random_uuid(),
  issue_id text not null references public.issues(id) on delete cascade,
  session_hash text not null,
  vote_type text not null check (vote_type in ('upvote')),
  created_at timestamptz not null default now(),
  unique(issue_id, session_hash, vote_type)
);

-- Resolve votes table
create table if not exists public.resolve_votes (
  id uuid primary key default gen_random_uuid(),
  issue_id text not null references public.issues(id) on delete cascade,
  session_hash text not null,
  vote text not null check (vote in ('yes','no')),
  created_at timestamptz not null default now(),
  unique(issue_id, session_hash)
);

-- Comments table
create table if not exists public.comments (
  id text primary key,
  issue_id text not null references public.issues(id) on delete cascade,
  text text not null,
  author text not null default 'Anonymous',
  is_anonymous boolean not null default true,
  session_hash text,
  created_at timestamptz not null default now()
);

create index if not exists idx_comments_issue_id on public.comments(issue_id);
create index if not exists idx_comments_created_at on public.comments(created_at desc);

-- Optional emergency contacts table
create table if not exists public.emergency_contacts (
  id text primary key,
  organization text not null,
  district text not null,
  phone text not null,
  service_type text not null check (service_type in ('police','medical','utilities','government')),
  is_247 boolean not null default false
);
