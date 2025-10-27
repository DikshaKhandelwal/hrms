# HRMS AI Integration - Complete Setup Guide

This guide will help you set up the complete AI-powered resume screening system with FastAPI backend and React frontend.

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  React Frontend │────────▶│  FastAPI Backend │────────▶│  OpenAI GPT-4   │
│  (Port 5173)    │         │  (Port 8000)     │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
         │                           │
         │                           │
         └───────────┬───────────────┘
                     ▼
              ┌──────────────┐
              │   Supabase   │
              │  PostgreSQL  │
              └──────────────┘
```

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Supabase account
- OpenAI API key

## Step 1: Database Setup

1. **Run the migration in Supabase SQL Editor:**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy the contents of `supabase/migrations/20251027120000_add_ai_resume_tables.sql`
   - Execute the SQL script
   - Verify tables: `jobs`, `prediction_history`, and updated `candidates` table

2. **Verify RLS policies are enabled:**
   - Check that Row Level Security is ON for all tables
   - Ensure policies allow authenticated users to read/write

## Step 2: Backend Setup (FastAPI)

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
   ```

3. **Start the backend server:**
   ```bash
   python main.py
   ```
   
   You should see:
   ```
   ✓ OpenAI initialized successfully
   INFO:     Uvicorn running on http://0.0.0.0:8000
   ```

4. **Test the API:**
   ```bash
   curl http://localhost:8000/api/health
   ```
   
   Expected response:
   ```json
   {"status": "healthy", "message": "API is running"}
   ```

## Step 3: Frontend Setup (React)

1. **Install frontend dependencies (if not already done):**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   Frontend will run on: `http://localhost:5173`

## Step 4: Test the Integration

1. **Login as a recruiter:**
   - Email: diksha1010.dk@gmail.com
   - Password: [your password]

2. **Navigate to AI Screening:**
   - Click on "AI Screening" tab in the recruiter dashboard

3. **Create a test job (if needed):**
   - Use the job creation form
   - Add job title, description, required skills, experience level

4. **Upload a resume:**
   - Select a PDF or DOCX resume file
   - Choose a job from the dropdown
   - Select "OpenAI" as the AI model
   - Click "Screen Resume"

5. **View results:**
   - Match score (0-100)
   - Skill match breakdown
   - Experience match
   - Matched and missing skills
   - AI-generated suggestions
   - Suitability summary

## API Endpoints Reference

### Backend (FastAPI)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API status check |
| `/api/health` | GET | Health check |
| `/api/parse-resume` | POST | Parse resume file |
| `/api/match-resume` | POST | Match resume to job with AI |

### Frontend API Calls

```typescript
// Parse a resume
const resumeData = await parseResumeFile(file);

// Match resume to job
const result = await matchResumeToJob(file, job, 'OpenAI');

// Save to database
await savePredictionHistory(candidateId, jobId, fileName, 'OpenAI', result);
```

## File Structure

```
hrms/
├── backend/
│   ├── main.py                 # FastAPI server
│   ├── openai_model.py         # OpenAI integration
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Environment template
│   ├── .env                    # Your API keys (gitignored)
│   └── README.md               # Backend documentation
│
├── src/
│   ├── lib/
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── aiMatcher.ts        # Frontend API client
│   │   └── resumeParser.ts     # Client-side parser
│   │
│   └── components/
│       └── features/
│           └── AIScreening.tsx # AI screening UI
│
├── supabase/
│   └── migrations/
│       └── 20251027120000_add_ai_resume_tables.sql
│
└── ai-resume-scan/             # Original Python AI code
    └── services/
        └── resume_parser.py    # Resume parsing logic
```

## Troubleshooting

### Backend Issues

**Error: "OpenAI API key not provided"**
- Solution: Add `OPENAI_API_KEY` to `backend/.env`

**Error: "Import 'services.resume_parser' could not be resolved"**
- Solution: Ensure `ai-resume-scan` folder exists and contains the Python code
- Check that `sys.path.append` in `main.py` points to correct location

**Error: "ModuleNotFoundError: No module named 'pdfplumber'"**
- Solution: Run `pip install -r requirements.txt` in backend folder

### Frontend Issues

**Error: "Failed to match resume: Failed to fetch"**
- Solution: Ensure backend is running on `http://localhost:8000`
- Check CORS configuration in `main.py`

**Error: "Failed to parse resume: 500 Internal Server Error"**
- Solution: Check backend logs for detailed error
- Verify resume file format (PDF or DOCX)

### Database Issues

**Error: "relation 'jobs' does not exist"**
- Solution: Run the migration SQL script in Supabase

**Error: "new row violates row-level security policy"**
- Solution: Verify RLS policies allow authenticated users to insert/update

## Development Workflow

1. **Make changes to backend:**
   - Edit Python files
   - Server auto-reloads (if using `--reload` flag)
   - Test API with curl or Postman

2. **Make changes to frontend:**
   - Edit TypeScript/React files
   - Vite HMR updates instantly
   - Check browser console for errors

3. **Update database schema:**
   - Create new migration file in `supabase/migrations/`
   - Run SQL in Supabase dashboard
   - Update TypeScript types in `src/lib/types.ts`

## Production Deployment

### Backend Deployment (Render/Heroku/Railway)

1. Add `Procfile`:
   ```
   web: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

2. Set environment variables:
   - `OPENAI_API_KEY`
   - `PORT` (if required by platform)

3. Deploy and note the URL

### Frontend Deployment (Vercel/Netlify)

1. Update `src/lib/aiMatcher.ts`:
   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
   ```

2. Set environment variable:
   - `VITE_API_URL=https://your-backend.onrender.com`

3. Deploy

## Cost Estimation

**OpenAI API (GPT-4o-mini):**
- Input: $0.150 / 1M tokens
- Output: $0.600 / 1M tokens
- Average resume screening: ~2,000 tokens
- Cost per screening: ~$0.0015
- 1,000 screenings: ~$1.50

**Alternative: Use GPT-3.5-turbo for even lower costs**

## Next Steps

- [ ] Apply database migration
- [ ] Get OpenAI API key
- [ ] Install backend dependencies
- [ ] Configure .env file
- [ ] Start backend server
- [ ] Test API endpoints
- [ ] Update AIScreening.tsx component UI
- [ ] Test end-to-end flow
- [ ] Deploy to production

## Support

For issues, check:
- Backend logs: Terminal running `python main.py`
- Frontend logs: Browser console (F12)
- Supabase logs: Dashboard → Logs
- OpenAI status: https://status.openai.com/
