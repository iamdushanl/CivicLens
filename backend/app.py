"""
Supabase SQL schema (run in Supabase SQL editor)

-- Enable UUID generation
create extension if not exists pgcrypto;

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

create table if not exists public.issue_votes (
  id uuid primary key default gen_random_uuid(),
  issue_id text not null references public.issues(id) on delete cascade,
  session_hash text not null,
  vote_type text not null check (vote_type in ('upvote')),
  created_at timestamptz not null default now(),
  unique(issue_id, session_hash, vote_type)
);

create table if not exists public.resolve_votes (
  id uuid primary key default gen_random_uuid(),
  issue_id text not null references public.issues(id) on delete cascade,
  session_hash text not null,
  vote text not null check (vote in ('yes','no')),
  created_at timestamptz not null default now(),
  unique(issue_id, session_hash)
);

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

-- Optional read-only contacts table if you want DB-backed contacts/hotlines.
create table if not exists public.emergency_contacts (
  id text primary key,
  organization text not null,
  district text not null,
  phone text not null,
  service_type text not null check (service_type in ('police','medical','utilities','government')),
  is_247 boolean not null default false
);
"""

from __future__ import annotations

import hashlib
import json
import os
import random
import threading
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

# Load environment variables from .env file
load_dotenv()

try:
    from supabase import create_client
except Exception:
    create_client = None

try:
    import google.generativeai as genai
except Exception:
    genai = None


GEMINI_PROMPT = (
    "Analyze this image of a civic issue in Sri Lanka. Classify it as "
    "exactly one of: pothole, streetlight, garbage, water, tree, other. "
    "Return ONLY valid JSON in this format:\n"
    "{\n"
    "  category: string,\n"
    "  confidence: float between 0 and 1,\n"
    "  severity_score: integer between 1 and 10,\n"
    "  severity_text: string (one sentence explaining severity)\n"
    "}\n"
    "Do not include markdown, backticks, or any other text."
)


def _env_bool(name: str, default: bool = False) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in {"1", "true", "yes", "y", "on"}


DEMO_MODE_ENV_DEFAULT = _env_bool("DEMO_MODE", True)
_demo_mode_override: Optional[bool] = None
_demo_lock = threading.Lock()


def is_demo_mode() -> bool:
    with _demo_lock:
        if _demo_mode_override is not None:
            return _demo_mode_override
    return DEMO_MODE_ENV_DEFAULT


def set_demo_mode_override(enabled: Optional[bool]) -> None:
    global _demo_mode_override
    with _demo_lock:
        _demo_mode_override = enabled


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def normalize_category(value: str) -> str:
    mapping = {
        "pothole": "potholes",
        "potholes": "potholes",
        "streetlight": "streetLights",
        "streetlights": "streetLights",
        "garbage": "garbage",
        "water": "waterSupply",
        "watersupply": "waterSupply",
        "tree": "publicSafety",
        "road": "roadDamage",
        "roadDamage": "roadDamage",
        "drainage": "drainage",
        "publicSafety": "publicSafety",
        "other": "other",
    }
    key = (value or "").strip().replace(" ", "")
    return mapping.get(key, "other")


def to_issue_shape(row: Dict[str, Any]) -> Dict[str, Any]:
    coords = None
    lat = row.get("lat")
    lng = row.get("lng")
    if lat is not None and lng is not None:
        coords = {"lat": lat, "lng": lng}

    created_at = row.get("created_at") or now_iso()
    resolved_at = row.get("resolved_at")

    return {
        "id": row.get("id"),
        "title": row.get("title", ""),
        "description": row.get("description", ""),
        "category": row.get("category", "other"),
        "severity": row.get("severity", "medium"),
        "status": row.get("status", "open"),
        "location": row.get("location", ""),
        "coordinates": coords,
        "photos": row.get("photos", []) or [],
        "upvotes": int(row.get("upvotes", 0) or 0),
        "commentCount": int(row.get("comment_count", 0) or 0),
        "reporter": row.get("reporter", "Anonymous"),
        "isAnonymous": bool(row.get("is_anonymous", True)),
        "createdAt": created_at,
        "aiConfidence": row.get("ai_confidence"),
        "aiCategory": row.get("ai_category"),
        "severityScore": row.get("severity_score"),
        "severityText": row.get("severity_text"),
        "resolutionConfirmations": int(row.get("resolution_confirmations", 0) or 0),
        "resolvedAt": resolved_at,
        "resolvedBy": row.get("resolved_by"),
    }


def to_comment_shape(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": row.get("id"),
        "issueId": row.get("issue_id"),
        "text": row.get("text", ""),
        "author": row.get("author", "Anonymous"),
        "isAnonymous": bool(row.get("is_anonymous", True)),
        "createdAt": row.get("created_at") or now_iso(),
    }


def round_coordinates(lat: Optional[float], lng: Optional[float]) -> Tuple[Optional[float], Optional[float]]:
    if lat is None or lng is None:
        return None, None
    return round(float(lat), 2), round(float(lng), 2)


def get_session_id() -> str:
    return request.headers.get("X-Session-ID", "anonymous-session")


def session_hash(session_id: str) -> str:
    salt = os.getenv("SESSION_SALT", "civiclens-session-salt")
    payload = f"{salt}:{session_id}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


MOCK_ISSUES: List[Dict[str, Any]] = [
    {
        "id": "CL-2024-001",
        "title": "Large pothole on Galle Road",
        "description": "Deep pothole near the bus stop causing accidents. Multiple vehicles have been damaged. Needs immediate attention.",
        "category": "potholes",
        "severity": "critical",
        "status": "open",
        "location": "Galle Road, Colombo 03",
        "coordinates": {"lat": 6.9147, "lng": 79.8563},
        "photos": [],
        "upvotes": 142,
        "commentCount": 23,
        "reporter": "Anonymous",
        "isAnonymous": True,
        "createdAt": "2026-02-21T07:00:00Z",
        "aiConfidence": 95,
        "aiCategory": "Pothole",
        "severityScore": 9,
        "resolutionConfirmations": 0,
    },
    {
        "id": "CL-2024-002",
        "title": "Broken street light on Duplication Road",
        "description": "Street light has been broken for over a week. Area is very dark at night, posing safety risks for pedestrians.",
        "category": "streetLights",
        "severity": "high",
        "status": "in-progress",
        "location": "Duplication Road, Colombo 04",
        "coordinates": {"lat": 6.8935, "lng": 79.8587},
        "photos": [],
        "upvotes": 89,
        "commentCount": 12,
        "reporter": "KS",
        "isAnonymous": False,
        "createdAt": "2026-02-20T14:30:00Z",
        "aiConfidence": 88,
        "aiCategory": "Street Light",
        "severityScore": 7,
        "resolutionConfirmations": 0,
    },
    {
        "id": "CL-2024-003",
        "title": "Garbage pile at Pettah Market",
        "description": "Large uncollected garbage pile near the entrance of Pettah Market. Causing severe health hazards and foul smell.",
        "category": "garbage",
        "severity": "high",
        "status": "open",
        "location": "Pettah Market, Colombo 11",
        "coordinates": {"lat": 6.9366, "lng": 79.8505},
        "photos": [],
        "upvotes": 234,
        "commentCount": 45,
        "reporter": "Anonymous",
        "isAnonymous": True,
        "createdAt": "2026-02-19T09:15:00Z",
        "aiConfidence": 97,
        "aiCategory": "Garbage",
        "severityScore": 8,
        "resolutionConfirmations": 0,
    },
    {
        "id": "CL-2024-004",
        "title": "Water pipe leak in Nugegoda",
        "description": "Major water pipe leak flooding the road and nearby shops. Clean water being wasted continuously.",
        "category": "waterSupply",
        "severity": "critical",
        "status": "open",
        "location": "High Level Road, Nugegoda",
        "coordinates": {"lat": 6.8722, "lng": 79.8897},
        "photos": [],
        "upvotes": 178,
        "commentCount": 31,
        "reporter": "RP",
        "isAnonymous": False,
        "createdAt": "2026-02-21T03:00:00Z",
        "aiConfidence": 91,
        "aiCategory": "Water Supply",
        "severityScore": 9,
        "resolutionConfirmations": 0,
    },
    {
        "id": "CL-2024-005",
        "title": "Cracked road surface on Marine Drive",
        "description": "Multiple cracks on the road surface creating hazardous conditions for motorcyclists and cyclists.",
        "category": "roadDamage",
        "severity": "medium",
        "status": "in-progress",
        "location": "Marine Drive, Colombo 06",
        "coordinates": {"lat": 6.8843, "lng": 79.8601},
        "photos": [],
        "upvotes": 67,
        "commentCount": 8,
        "reporter": "AN",
        "isAnonymous": False,
        "createdAt": "2026-02-18T11:45:00Z",
        "aiConfidence": 84,
        "aiCategory": "Road Damage",
        "severityScore": 5,
        "resolutionConfirmations": 0,
    },
    {
        "id": "CL-2024-006",
        "title": "Blocked drainage at Town Hall junction",
        "description": "Drainage system completely blocked causing flooding during rains. Stagnant water breeding mosquitoes.",
        "category": "drainage",
        "severity": "high",
        "status": "open",
        "location": "Town Hall, Colombo 07",
        "coordinates": {"lat": 6.9114, "lng": 79.8637},
        "photos": [],
        "upvotes": 156,
        "commentCount": 19,
        "reporter": "Anonymous",
        "isAnonymous": True,
        "createdAt": "2026-02-17T16:20:00Z",
        "aiConfidence": 89,
        "aiCategory": "Drainage",
        "severityScore": 7,
        "resolutionConfirmations": 0,
    },
    {
        "id": "CL-2024-007",
        "title": "Missing manhole cover near University",
        "description": "Dangerous open manhole near Colombo University entrance. Students and pedestrians at risk of falling in.",
        "category": "publicSafety",
        "severity": "critical",
        "status": "open",
        "location": "Reid Avenue, Colombo 07",
        "coordinates": {"lat": 6.9037, "lng": 79.8614},
        "photos": [],
        "upvotes": 312,
        "commentCount": 56,
        "reporter": "DM",
        "isAnonymous": False,
        "createdAt": "2026-02-21T01:00:00Z",
        "aiConfidence": 93,
        "aiCategory": "Public Safety",
        "severityScore": 10,
        "resolutionConfirmations": 0,
    },
    {
        "id": "CL-2024-008",
        "title": "Overflowing garbage bins in Bambalapitiya",
        "description": "Multiple garbage bins overflowing for 3 days. Stray animals scattering waste around the area.",
        "category": "garbage",
        "severity": "medium",
        "status": "open",
        "location": "Bambalapitiya, Colombo 04",
        "coordinates": {"lat": 6.8923, "lng": 79.8570},
        "photos": [],
        "upvotes": 45,
        "commentCount": 7,
        "reporter": "Anonymous",
        "isAnonymous": True,
        "createdAt": "2026-02-20T08:00:00Z",
        "aiConfidence": 96,
        "aiCategory": "Garbage",
        "severityScore": 5,
        "resolutionConfirmations": 0,
    },
    {
        "id": "CL-2024-009",
        "title": "Broken sidewalk tiles in Fort area",
        "description": "Several sidewalk tiles are broken and uneven, causing tripping hazard for pedestrians especially elderly.",
        "category": "roadDamage",
        "severity": "low",
        "status": "in-progress",
        "location": "Fort, Colombo 01",
        "coordinates": {"lat": 6.9342, "lng": 79.8428},
        "photos": [],
        "upvotes": 28,
        "commentCount": 4,
        "reporter": "ML",
        "isAnonymous": False,
        "createdAt": "2026-02-16T13:30:00Z",
        "aiConfidence": 79,
        "aiCategory": "Road Damage",
        "severityScore": 3,
        "resolutionConfirmations": 0,
    },
    {
        "id": "CL-2024-010",
        "title": "No street lighting on Baseline Road stretch",
        "description": "500m stretch of Baseline Road has no working street lights. Area reported to have increase in crime.",
        "category": "streetLights",
        "severity": "high",
        "status": "open",
        "location": "Baseline Road, Colombo 09",
        "coordinates": {"lat": 6.9267, "lng": 79.8748},
        "photos": [],
        "upvotes": 198,
        "commentCount": 34,
        "reporter": "Anonymous",
        "isAnonymous": True,
        "createdAt": "2026-02-15T19:00:00Z",
        "aiConfidence": 86,
        "aiCategory": "Street Light",
        "severityScore": 8,
        "resolutionConfirmations": 0,
    },
]

MOCK_RESOLVED_ISSUES: List[Dict[str, Any]] = [
    {
        "id": "CL-2024-R01",
        "title": "Pothole fixed on Havelock Road",
        "description": "Large pothole that was causing traffic congestion has been repaired by CMC.",
        "category": "potholes",
        "severity": "high",
        "status": "resolved",
        "location": "Havelock Road, Colombo 05",
        "photos": [],
        "upvotes": 87,
        "commentCount": 15,
        "reporter": "TK",
        "isAnonymous": False,
        "createdAt": "2026-02-10T10:00:00Z",
        "resolvedAt": "2026-02-18T14:00:00Z",
        "resolvedBy": "community",
        "severityScore": 7,
    },
    {
        "id": "CL-2024-R02",
        "title": "Garbage cleared at Wellawatte Beach",
        "description": "Beach area cleanup completed by municipal workers after community reporting.",
        "category": "garbage",
        "severity": "medium",
        "status": "resolved",
        "location": "Wellawatte Beach, Colombo 06",
        "photos": [],
        "upvotes": 124,
        "commentCount": 22,
        "reporter": "Anonymous",
        "isAnonymous": True,
        "createdAt": "2026-02-08T07:30:00Z",
        "resolvedAt": "2026-02-14T11:00:00Z",
        "resolvedBy": "official",
        "severityScore": 5,
    },
    {
        "id": "CL-2024-R03",
        "title": "Street lights restored on Bauddhaloka Mawatha",
        "description": "All 12 broken street lights along Bauddhaloka Mawatha have been replaced.",
        "category": "streetLights",
        "severity": "high",
        "status": "resolved",
        "location": "Bauddhaloka Mawatha, Colombo 07",
        "photos": [],
        "upvotes": 201,
        "commentCount": 38,
        "reporter": "NS",
        "isAnonymous": False,
        "createdAt": "2026-02-05T15:00:00Z",
        "resolvedAt": "2026-02-19T09:00:00Z",
        "resolvedBy": "reporter",
        "severityScore": 7,
    },
]

MOCK_COMMENTS: List[Dict[str, Any]] = [
    {
        "id": "c1",
        "issueId": "CL-2024-001",
        "text": "I almost damaged my car here yesterday. This needs urgent repair!",
        "author": "Anonymous",
        "isAnonymous": True,
        "createdAt": "2026-02-21T08:30:00Z",
    },
    {
        "id": "c2",
        "issueId": "CL-2024-001",
        "text": "CMC was notified last week but no action taken yet.",
        "author": "PK",
        "isAnonymous": False,
        "createdAt": "2026-02-21T07:45:00Z",
    },
    {
        "id": "c3",
        "issueId": "CL-2024-001",
        "text": "Same issue reported 3 months ago and was fixed temporarily. Poor quality work.",
        "author": "Anonymous",
        "isAnonymous": True,
        "createdAt": "2026-02-20T22:00:00Z",
    },
]

MOCK_EMERGENCY_CONTACTS: List[Dict[str, Any]] = [
    {"id": "e1", "organization": "Colombo North Police Station", "district": "Colombo", "phone": "011-2421111", "serviceType": "police", "is247": True},
    {"id": "e2", "organization": "Colombo South Police Station", "district": "Colombo", "phone": "011-2432222", "serviceType": "police", "is247": True},
    {"id": "e3", "organization": "National Hospital Colombo", "district": "Colombo", "phone": "011-2691111", "serviceType": "medical", "is247": True},
    {"id": "e4", "organization": "Colombo General Hospital", "district": "Colombo", "phone": "011-2693184", "serviceType": "medical", "is247": True},
    {"id": "e5", "organization": "CEB - Colombo Region", "district": "Colombo", "phone": "011-2343222", "serviceType": "utilities", "is247": False},
    {"id": "e6", "organization": "NWSDB - Colombo", "district": "Colombo", "phone": "011-2636449", "serviceType": "utilities", "is247": False},
    {"id": "e7", "organization": "Colombo Municipal Council", "district": "Colombo", "phone": "011-2686827", "serviceType": "government", "is247": False},
    {"id": "e8", "organization": "Kandy Municipal Council", "district": "Kandy", "phone": "081-2222275", "serviceType": "government", "is247": False},
    {"id": "e9", "organization": "Kandy Police Station", "district": "Kandy", "phone": "081-2222222", "serviceType": "police", "is247": True},
    {"id": "e10", "organization": "Kandy General Hospital", "district": "Kandy", "phone": "081-2222261", "serviceType": "medical", "is247": True},
    {"id": "e11", "organization": "Galle Police Station", "district": "Galle", "phone": "091-2234036", "serviceType": "police", "is247": True},
    {"id": "e12", "organization": "Galle General Hospital", "district": "Galle", "phone": "091-2232276", "serviceType": "medical", "is247": True},
]

MOCK_NATIONAL_HOTLINES: List[Dict[str, Any]] = [
    {"name": "Police", "number": "119", "icon": "shield"},
    {"name": "Ambulance", "number": "1990", "icon": "ambulance"},
    {"name": "Fire", "number": "110", "icon": "flame"},
    {"name": "CEB", "number": "1987", "icon": "zap"},
    {"name": "NWSDB", "number": "1938", "icon": "droplets"},
]


class DemoStore:
    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.issues = deepcopy(MOCK_ISSUES)
        self.resolved_issues = deepcopy(MOCK_RESOLVED_ISSUES)
        self.comments = deepcopy(MOCK_COMMENTS)
        self.upvote_sessions: set[str] = set()
        self.resolve_sessions: set[str] = set()
        self.resolve_vote_counts: Dict[str, Dict[str, int]] = {}

        for issue in self.all_issues():
            yes_votes = int(issue.get("resolutionConfirmations", 0) or 0)
            self.resolve_vote_counts[issue.get("id")] = {"yes": yes_votes, "no": 0}

    def all_issues(self) -> List[Dict[str, Any]]:
        return self.issues + self.resolved_issues


DEMO_STORE = DemoStore()


SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

supabase = None
if create_client and SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    except Exception:
        supabase = None

if genai and GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
    except Exception:
        pass


def classify_image_with_gemini(photo_bytes: bytes, mime_type: str = "image/jpeg") -> Dict[str, Any]:
    default_result = {
        "category": "other",
        "confidence": 0.5,
        "severity_score": 5,
        "severity_text": "Severity appears moderate based on visible evidence.",
    }
    if not genai or not GEMINI_API_KEY or not photo_bytes:
        return default_result

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        image_part = {"mime_type": mime_type or "image/jpeg", "data": photo_bytes}
        response = model.generate_content([GEMINI_PROMPT, image_part])
        text = (response.text or "").strip()
        if text.startswith("```"):
            text = text.strip("`").replace("json", "", 1).strip()
        payload = json.loads(text)

        category = str(payload.get("category", "other")).lower().strip()
        confidence = float(payload.get("confidence", 0.5))
        severity_score = int(payload.get("severity_score", 5))
        severity_text = str(payload.get("severity_text", default_result["severity_text"]))

        return {
            "category": category,
            "confidence": min(max(confidence, 0.0), 1.0),
            "severity_score": min(max(severity_score, 1), 10),
            "severity_text": severity_text,
        }
    except Exception:
        return default_result


app = Flask(__name__)

allowed_origins = {"http://localhost:3000", "https://localhost:3000"}
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.add(frontend_url)
vercel_url = os.getenv("VERCEL_URL")
if vercel_url:
    if vercel_url.startswith("http"):
        allowed_origins.add(vercel_url)
    else:
        allowed_origins.add(f"https://{vercel_url}")
allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_env:
    for value in allowed_origins_env.split(","):
        trimmed = value.strip()
        if trimmed:
            allowed_origins.add(trimmed)

CORS(
    app,
    resources={r"/api/*": {"origins": list(allowed_origins)}},
    allow_headers=["Content-Type", "Authorization", "X-Session-ID"],
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
)


@app.get("/api/health")
def get_health():
    return jsonify(
        {
            "ok": True,
            "status": "healthy",
            "timestamp": now_iso(),
            "demo_mode": is_demo_mode(),
            "supabase_enabled": bool(supabase),
            "gemini_enabled": bool(genai and GEMINI_API_KEY),
        }
    )


@app.get("/api/mock-data")
def get_mock_data_bundle():
    return jsonify(
        {
            "mockIssues": deepcopy(MOCK_ISSUES),
            "mockResolvedIssues": deepcopy(MOCK_RESOLVED_ISSUES),
            "mockComments": deepcopy(MOCK_COMMENTS),
            "emergencyContacts": deepcopy(MOCK_EMERGENCY_CONTACTS),
            "nationalHotlines": deepcopy(MOCK_NATIONAL_HOTLINES),
        }
    )


@app.get("/api/admin/demo-mode")
def get_demo_mode_state():
    return jsonify(
        {
            "demo_mode": is_demo_mode(),
            "env_default": DEMO_MODE_ENV_DEFAULT,
            "runtime_override": _demo_mode_override,
        }
    )


@app.post("/api/admin/demo-mode")
def set_demo_mode_state():
    payload = request.get_json(silent=True) or {}
    if "enabled" not in payload:
        return jsonify({"error": "Missing 'enabled' boolean"}), 400
    enabled = bool(payload.get("enabled"))
    set_demo_mode_override(enabled)
    return jsonify(
        {
            "demo_mode": is_demo_mode(),
            "env_default": DEMO_MODE_ENV_DEFAULT,
            "runtime_override": enabled,
        }
    )


def apply_issue_filters(issues: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    status = request.args.get("status")
    category = request.args.get("category")
    sort_by = request.args.get("sort", "upvotes")

    filtered = issues
    if status:
        filtered = [i for i in filtered if i.get("status") == status]
    if category:
        filtered = [i for i in filtered if i.get("category") == category]

    if sort_by == "recent":
        filtered.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    else:
        filtered.sort(key=lambda x: int(x.get("upvotes", 0)), reverse=True)

    limit = request.args.get("limit")
    if limit:
        try:
            n = int(limit)
            if n > 0:
                filtered = filtered[:n]
        except Exception:
            pass

    return filtered


@app.get("/api/issues")
def get_issues():
    if is_demo_mode() or not supabase:
        with DEMO_STORE.lock:
            issues = deepcopy(DEMO_STORE.all_issues())
        return jsonify(apply_issue_filters(issues))

    try:
        query = supabase.table("issues").select("*")
        status = request.args.get("status")
        category = request.args.get("category")
        if status:
            query = query.eq("status", status)
        if category:
            query = query.eq("category", category)

        data = query.execute().data or []
        issues = [to_issue_shape(row) for row in data]
        issues = apply_issue_filters(issues)
        return jsonify(issues)
    except Exception as exc:
        return jsonify({"error": f"Failed to fetch issues: {exc}"}), 500


@app.get("/api/issues/<issue_id>")
def get_issue_by_id(issue_id: str):
    if is_demo_mode() or not supabase:
        with DEMO_STORE.lock:
            issue = next((i for i in DEMO_STORE.all_issues() if i.get("id") == issue_id), None)
        if not issue:
            return jsonify({"error": "Issue not found"}), 404
        return jsonify(deepcopy(issue))

    try:
        data = supabase.table("issues").select("*").eq("id", issue_id).limit(1).execute().data
        if not data:
            return jsonify({"error": "Issue not found"}), 404
        return jsonify(to_issue_shape(data[0]))
    except Exception as exc:
        return jsonify({"error": f"Failed to fetch issue: {exc}"}), 500


@app.post("/api/issues")
def create_issue():
    title = request.form.get("title", "").strip()
    description = request.form.get("description", "").strip()
    category = normalize_category(request.form.get("category", "other"))
    severity = request.form.get("severity", "medium")
    location = request.form.get("location", "Unknown location").strip()
    is_anonymous = str(request.form.get("isAnonymous", "true")).lower() == "true"

    lat = request.form.get("lat")
    lng = request.form.get("lng")
    rounded_lat, rounded_lng = round_coordinates(float(lat), float(lng)) if lat and lng else (None, None)

    if not title or not description:
        return jsonify({"error": "title and description are required"}), 400

    photos = request.files.getlist("photos")
    photo_urls: List[str] = []
    first_photo = photos[0] if photos else None

    ai_result = {
        "category": category,
        "confidence": 0.5,
        "severity_score": 5,
        "severity_text": "Severity appears moderate based on visible evidence.",
    }

    if first_photo:
        photo_bytes = first_photo.read()
        first_photo.stream.seek(0)
        ai_result = classify_image_with_gemini(photo_bytes, first_photo.mimetype or "image/jpeg")
        category = normalize_category(ai_result.get("category", category))

    issue_id = f"CL-{datetime.now(timezone.utc).year}-{str(random.randint(1, 9999)).zfill(4)}"
    payload = {
        "id": issue_id,
        "title": title,
        "description": description,
        "category": category,
        "severity": severity,
        "status": "open",
        "location": location,
        "coordinates": {"lat": rounded_lat, "lng": rounded_lng} if rounded_lat is not None and rounded_lng is not None else None,
        "photos": photo_urls,
        "upvotes": 0,
        "commentCount": 0,
        "reporter": "Anonymous" if is_anonymous else "Citizen",
        "isAnonymous": is_anonymous,
        "createdAt": now_iso(),
        "aiConfidence": int(float(ai_result.get("confidence", 0.5)) * 100),
        "aiCategory": ai_result.get("category", "other"),
        "severityScore": int(ai_result.get("severity_score", 5)),
        "severityText": ai_result.get("severity_text", "Severity appears moderate based on visible evidence."),
        "resolutionConfirmations": 0,
    }

    if is_demo_mode() or not supabase:
        with DEMO_STORE.lock:
            DEMO_STORE.issues.insert(0, deepcopy(payload))
        return jsonify(payload), 201

    try:
        db_payload = {
            "id": issue_id,
            "title": title,
            "description": description,
            "category": category,
            "severity": severity,
            "status": "open",
            "location": location,
            "lat": rounded_lat,
            "lng": rounded_lng,
            "photos": photo_urls,
            "upvotes": 0,
            "comment_count": 0,
            "reporter": "Anonymous" if is_anonymous else "Citizen",
            "is_anonymous": is_anonymous,
            "ai_confidence": int(float(ai_result.get("confidence", 0.5)) * 100),
            "ai_category": ai_result.get("category", "other"),
            "severity_score": int(ai_result.get("severity_score", 5)),
            "severity_text": ai_result.get("severity_text", "Severity appears moderate based on visible evidence."),
            "resolution_confirmations": 0,
        }
        created = supabase.table("issues").insert(db_payload).execute().data
        if not created:
            return jsonify({"error": "Failed to create issue"}), 500
        return jsonify(to_issue_shape(created[0])), 201
    except Exception as exc:
        return jsonify({"error": f"Failed to create issue: {exc}"}), 500


@app.post("/api/issues/<issue_id>/upvote")
def upvote_issue(issue_id: str):
    sid_hash = session_hash(get_session_id())

    if is_demo_mode() or not supabase:
        key = f"{issue_id}:{sid_hash}"
        with DEMO_STORE.lock:
            issue = next((i for i in DEMO_STORE.all_issues() if i.get("id") == issue_id), None)
            if not issue:
                return jsonify({"error": "Issue not found"}), 404
            if key in DEMO_STORE.upvote_sessions:
                return jsonify({"issueId": issue_id, "upvotes": issue.get("upvotes", 0), "duplicate": True})
            DEMO_STORE.upvote_sessions.add(key)
            issue["upvotes"] = int(issue.get("upvotes", 0)) + 1
            return jsonify({"issueId": issue_id, "upvotes": issue["upvotes"], "duplicate": False})

    try:
        existing_vote = (
            supabase.table("issue_votes")
            .select("id")
            .eq("issue_id", issue_id)
            .eq("session_hash", sid_hash)
            .eq("vote_type", "upvote")
            .limit(1)
            .execute()
            .data
        )
        if existing_vote:
            issue = supabase.table("issues").select("upvotes").eq("id", issue_id).limit(1).execute().data
            count = int(issue[0].get("upvotes", 0)) if issue else 0
            return jsonify({"issueId": issue_id, "upvotes": count, "duplicate": True})

        supabase.table("issue_votes").insert(
            {"issue_id": issue_id, "session_hash": sid_hash, "vote_type": "upvote"}
        ).execute()
        issue = supabase.table("issues").select("upvotes").eq("id", issue_id).limit(1).execute().data
        if not issue:
            return jsonify({"error": "Issue not found"}), 404
        new_count = int(issue[0].get("upvotes", 0)) + 1
        updated = (
            supabase.table("issues").update({"upvotes": new_count}).eq("id", issue_id).execute().data
        )
        final_count = int(updated[0].get("upvotes", new_count)) if updated else new_count
        return jsonify({"issueId": issue_id, "upvotes": final_count, "duplicate": False})
    except Exception as exc:
        return jsonify({"error": f"Failed to upvote: {exc}"}), 500


@app.post("/api/issues/<issue_id>/resolve-vote")
def resolve_vote(issue_id: str):
    payload = request.get_json(silent=True) or {}
    vote = payload.get("vote")
    if vote not in {"yes", "no"}:
        return jsonify({"error": "vote must be 'yes' or 'no'"}), 400

    sid_hash = session_hash(get_session_id())

    if is_demo_mode() or not supabase:
        key = f"{issue_id}:{sid_hash}"
        with DEMO_STORE.lock:
            issue = next((i for i in DEMO_STORE.all_issues() if i.get("id") == issue_id), None)
            if not issue:
                return jsonify({"error": "Issue not found"}), 404

            if issue_id not in DEMO_STORE.resolve_vote_counts:
                DEMO_STORE.resolve_vote_counts[issue_id] = {
                    "yes": int(issue.get("resolutionConfirmations", 0) or 0),
                    "no": 0,
                }

            counts = DEMO_STORE.resolve_vote_counts[issue_id]
            if key in DEMO_STORE.resolve_sessions:
                return jsonify(
                    {
                        "issueId": issue_id,
                        "yes": counts["yes"],
                        "no": counts["no"],
                        "total": counts["yes"] + counts["no"],
                        "duplicate": True,
                    }
                )

            DEMO_STORE.resolve_sessions.add(key)
            counts[vote] = int(counts.get(vote, 0)) + 1
            issue["resolutionConfirmations"] = counts["yes"]
            return jsonify(
                {
                    "issueId": issue_id,
                    "yes": counts["yes"],
                    "no": counts["no"],
                    "total": counts["yes"] + counts["no"],
                    "duplicate": False,
                }
            )

    try:
        existing = (
            supabase.table("resolve_votes")
            .select("id")
            .eq("issue_id", issue_id)
            .eq("session_hash", sid_hash)
            .limit(1)
            .execute()
            .data
        )
        if existing:
            yes_count = (
                supabase.table("resolve_votes").select("id", count="exact").eq("issue_id", issue_id).eq("vote", "yes").execute().count
            ) or 0
            no_count = (
                supabase.table("resolve_votes").select("id", count="exact").eq("issue_id", issue_id).eq("vote", "no").execute().count
            ) or 0
            return jsonify({"issueId": issue_id, "yes": yes_count, "no": no_count, "total": yes_count + no_count, "duplicate": True})

        supabase.table("resolve_votes").insert(
            {"issue_id": issue_id, "session_hash": sid_hash, "vote": vote}
        ).execute()

        yes_count = (
            supabase.table("resolve_votes").select("id", count="exact").eq("issue_id", issue_id).eq("vote", "yes").execute().count
        ) or 0
        no_count = (
            supabase.table("resolve_votes").select("id", count="exact").eq("issue_id", issue_id).eq("vote", "no").execute().count
        ) or 0

        supabase.table("issues").update({"resolution_confirmations": yes_count}).eq("id", issue_id).execute()

        return jsonify({"issueId": issue_id, "yes": yes_count, "no": no_count, "total": yes_count + no_count, "duplicate": False})
    except Exception as exc:
        return jsonify({"error": f"Failed to submit resolve vote: {exc}"}), 500


@app.get("/api/issues/<issue_id>/comments")
def get_comments(issue_id: str):
    if is_demo_mode() or not supabase:
        with DEMO_STORE.lock:
            comments = [c for c in DEMO_STORE.comments if c.get("issueId") == issue_id]
        comments.sort(key=lambda c: c.get("createdAt", ""), reverse=True)
        return jsonify(deepcopy(comments))

    try:
        data = (
            supabase.table("comments")
            .select("*")
            .eq("issue_id", issue_id)
            .order("created_at", desc=True)
            .execute()
            .data
            or []
        )
        return jsonify([to_comment_shape(c) for c in data])
    except Exception as exc:
        return jsonify({"error": f"Failed to fetch comments: {exc}"}), 500


@app.post("/api/issues/<issue_id>/comments")
def post_comment(issue_id: str):
    payload = request.get_json(silent=True) or {}
    text = str(payload.get("text", "")).strip()
    anonymous = bool(payload.get("anonymous", True))
    if not text:
        return jsonify({"error": "text is required"}), 400

    sid_hash = session_hash(get_session_id())
    comment = {
        "id": f"c-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
        "issueId": issue_id,
        "text": text,
        "author": "Anonymous" if anonymous else "Citizen",
        "isAnonymous": anonymous,
        "createdAt": now_iso(),
    }

    if is_demo_mode() or not supabase:
        with DEMO_STORE.lock:
            DEMO_STORE.comments.insert(0, deepcopy(comment))
            issue = next((i for i in DEMO_STORE.all_issues() if i.get("id") == issue_id), None)
            if issue:
                issue["commentCount"] = int(issue.get("commentCount", 0)) + 1
        return jsonify(comment), 201

    try:
        db_comment = {
            "id": comment["id"],
            "issue_id": issue_id,
            "text": text,
            "author": "Anonymous" if anonymous else "Citizen",
            "is_anonymous": anonymous,
            "session_hash": sid_hash,
        }
        created = supabase.table("comments").insert(db_comment).execute().data
        existing_issue = supabase.table("issues").select("comment_count").eq("id", issue_id).limit(1).execute().data
        if existing_issue:
            count = int(existing_issue[0].get("comment_count", 0)) + 1
            supabase.table("issues").update({"comment_count": count}).eq("id", issue_id).execute()
        if not created:
            return jsonify(comment), 201
        return jsonify(to_comment_shape(created[0])), 201
    except Exception as exc:
        return jsonify({"error": f"Failed to post comment: {exc}"}), 500


@app.get("/api/stats")
def get_stats():
    if is_demo_mode() or not supabase:
        with DEMO_STORE.lock:
            all_issues = DEMO_STORE.all_issues()
            total_reports = len(all_issues)
            resolved_this_week = len([i for i in DEMO_STORE.resolved_issues])
            active_issues = len([i for i in all_issues if i.get("status") != "resolved"])
            category_counts: Dict[str, int] = {}
            for issue in all_issues:
                category = issue.get("category", "other")
                category_counts[category] = category_counts.get(category, 0) + 1
            top_category = max(category_counts.items(), key=lambda x: x[1])[0] if category_counts else "other"
        return jsonify(
            {
                "totalReports": total_reports,
                "resolvedThisWeek": resolved_this_week,
                "activeIssues": active_issues,
                "topCategory": top_category,
            }
        )

    try:
        all_rows = supabase.table("issues").select("id,status,category,resolved_at").execute().data or []
        total_reports = len(all_rows)
        active_issues = len([r for r in all_rows if r.get("status") != "resolved"])
        now = datetime.now(timezone.utc)
        resolved_this_week = 0
        category_counts: Dict[str, int] = {}

        for row in all_rows:
            category = row.get("category", "other")
            category_counts[category] = category_counts.get(category, 0) + 1
            resolved_at = row.get("resolved_at")
            if resolved_at:
                try:
                    dt = datetime.fromisoformat(str(resolved_at).replace("Z", "+00:00"))
                    if (now - dt).days <= 7:
                        resolved_this_week += 1
                except Exception:
                    pass

        top_category = max(category_counts.items(), key=lambda x: x[1])[0] if category_counts else "other"
        return jsonify(
            {
                "totalReports": total_reports,
                "resolvedThisWeek": resolved_this_week,
                "activeIssues": active_issues,
                "topCategory": top_category,
            }
        )
    except Exception as exc:
        return jsonify({"error": f"Failed to fetch stats: {exc}"}), 500


@app.get("/api/contacts")
def get_contacts():
    return jsonify(deepcopy(MOCK_EMERGENCY_CONTACTS))


@app.get("/api/hotlines")
def get_hotlines():
    return jsonify(deepcopy(MOCK_NATIONAL_HOTLINES))


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    debug = _env_bool("FLASK_DEBUG", True)
    app.run(host="0.0.0.0", port=port, debug=debug)
