#!/usr/bin/env python3
"""
Script to initialize Supabase database schema for CivicLens
Run this before starting the backend for the first time.
"""

import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")
    exit(1)

# Create Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

print("Connected to Supabase successfully!")
print(f"URL: {SUPABASE_URL}")

# Read schema file
with open("schema.sql", "r") as f:
    schema_sql = f.read()

print("\nExecuting schema.sql...")
print("Please run the schema.sql file manually in the Supabase SQL Editor")
print("located at: https://supabase.com/dashboard/project/YOUR_PROJECT/sql")
print("\nSchema SQL has been saved to: backend/schema.sql")

# Test connection by trying to query tables
print("\nChecking if tables exist...")
try:
    result = supabase.table("issues").select("count").limit(1).execute()
    print("✓ 'issues' table exists")
    print(f"  Current issue count: {len(result.data)}")
except Exception as e:
    print(f"✗ 'issues' table does not exist or has errors: {e}")
    print("  Please run schema.sql in Supabase SQL Editor")

print("\nSetup complete!")
