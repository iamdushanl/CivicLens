# CivicLens Backend

Flask API backend for CivicLens civic issue reporting platform.

## Features

- **Supabase Integration**: PostgreSQL database for persistent storage
- **Gemini Vision AI**: Automatic categorization and severity analysis of issue photos
- **Session-based Voting**: Prevent duplicate votes using session hashing
- **Demo Mode**: Fallback to in-memory mock data when database is unavailable
- **CORS Enabled**: Configured for frontend communication

## Setup

### Prerequisites

- Python 3.8+
- Supabase account (https://supabase.com/)
- Google Gemini API key (https://makersuite.google.com/app/apikey)

### Installation

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Configure environment variables in `.env`:
   ```env
   # Runtime
   DEMO_MODE=false
   FLASK_DEBUG=false
   PORT=5000

   # CORS
   FRONTEND_URL=http://localhost:3000
   ALLOWED_ORIGINS=http://localhost:3000

   # Supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Gemini
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Initialize database tables:
   - Open Supabase Dashboard → SQL Editor
   - Copy and run the contents of `schema.sql`
   - Verify tables are created

5. Start the server:
   ```bash
   python app.py
   ```

   Or with Gunicorn (production):
   ```bash
   gunicorn app:app --bind 0.0.0.0:5000
   ```

## API Endpoints

### Health Check
```
GET /api/health
```

Returns server status and configuration.

### Issues
```
GET /api/issues?status=open&category=potholes&sort=upvotes
POST /api/issues
GET /api/issues/:id
POST /api/issues/:id/upvote
```

### Comments
```
GET /api/issues/:id/comments
POST /api/issues/:id/comments
```

### Resolution Voting
```
POST /api/issues/:id/resolve-vote
```

### Statistics
```
GET /api/stats
```

### Emergency Contacts
```
GET /api/contacts
GET /api/hotlines
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DEMO_MODE` | Enable mock data mode (true/false) | No (default: true) |
| `FLASK_DEBUG` | Enable Flask debug mode | No (default: false) |
| `PORT` | Server port | No (default: 5000) |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes* |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes* |
| `GEMINI_API_KEY` | Google Gemini API key | Yes* |
| `SESSION_SALT` | Salt for session hashing | No (default provided) |

*Required when `DEMO_MODE=false`

## Demo Mode

When `DEMO_MODE=true` or database connection fails, the backend uses in-memory mock data. This is useful for:
- Development without database setup
- Testing frontend independently
- Demonstrations

Toggle demo mode at runtime:
```bash
POST /api/admin/demo-mode
{
  "enabled": true
}
```

## Deployment

### Render.com

1. Create new Web Service
2. Connect GitHub repository
3. Configure:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
4. Add environment variables
5. Deploy

## Database Schema

See `schema.sql` for complete database schema including:
- Issues table with geolocation support
- Comments with session tracking
- Vote tracking (upvotes and resolution votes)
- Emergency contacts (optional)

## License

MIT
