# HRMS Backend - AI Resume Scanner API

FastAPI backend for AI-powered resume parsing and job matching.

## Setup

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   ```

3. **Run the server:**
   ```bash
   python main.py
   ```
   
   Or with uvicorn directly:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

## API Endpoints

### GET `/`
Root endpoint - API status

### POST `/api/parse-resume`
Parse a resume file and extract skills, experience, and text.

**Request:**
- Form data with file upload (PDF or DOCX)

**Response:**
```json
{
  "success": true,
  "data": {
    "raw_text": "Resume text...",
    "skills": ["Python", "JavaScript", ...],
    "years_experience": 5
  }
}
```

### POST `/api/match-resume`
Match a resume to a job posting using OpenAI.

**Request:**
- Form data with:
  - `file`: Resume file (PDF or DOCX)
  - `job_title`: Job title
  - `job_description`: Full job description
  - `experience_level`: Required experience (e.g., "3-5 years")
  - `skills_required`: Comma-separated skills
  - `company_name` (optional)
  - `location` (optional)
  - `industry` (optional)
  - `employment_mode` (optional)

**Response:**
```json
{
  "match_score": 85,
  "skill_match": 90,
  "experience_match": 80,
  "matched_skills": ["Python", "React", "SQL"],
  "missing_skills": ["Kubernetes", "Docker"],
  "suggestions": "Consider gaining experience with...",
  "resume_data": {
    "raw_text": "...",
    "skills": [...],
    "years_experience": 5
  },
  "gemini_suitability_summary": "Strong candidate with relevant experience..."
}
```

### GET `/api/health`
Health check endpoint

## Architecture

- **FastAPI**: Modern Python web framework
- **OpenAI GPT-4o-mini**: AI model for resume analysis
- **PDF/DOCX Parsing**: Extract text from resume files
- **CORS Enabled**: Accepts requests from React frontend (localhost:5173)

## Dependencies

See `requirements.txt` for full list:
- fastapi
- uvicorn
- openai
- pdfplumber
- python-docx
- python-multipart
- pydantic
- python-dotenv
