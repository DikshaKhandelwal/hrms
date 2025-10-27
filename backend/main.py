from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the ai-resume-scan folder to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ai-resume-scan'))

# Copy the openai_model.py to ai-resume-scan services folder
backend_path = os.path.dirname(__file__)
sys.path.insert(0, backend_path)

from services.resume_parser import parse_resume
from openai_model import initialize_openai, analyze_resume_with_openai
import io

# Initialize OpenAI
try:
    initialize_openai()
    print("✓ OpenAI initialized successfully")
except Exception as e:
    print(f"Warning: OpenAI initialization failed - {e}")
    print("Make sure OPENAI_API_KEY is set in .env file")

app = FastAPI(title="HRMS AI Resume Scanner API")

# Configure CORS to allow requests from your React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class JobData(BaseModel):
    job_title: str
    company_name: Optional[str] = None
    job_description: str
    location: Optional[str] = None
    experience_level: str
    skills_required: str  # Comma-separated
    industry: Optional[str] = None
    employment_mode: Optional[str] = None

class ResumeMatchRequest(BaseModel):
    job_data: JobData
    model_choice: str = "OpenAI"  # OpenAI, Rule-Based Fallback

class ResumeMatchResponse(BaseModel):
    match_score: int
    skill_match: int
    experience_match: int
    matched_skills: List[str]
    missing_skills: List[str]
    suggestions: str
    resume_data: dict
    gemini_suitability_summary: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "HRMS AI Resume Scanner API", "status": "running"}

@app.post("/api/parse-resume")
async def parse_resume_endpoint(file: UploadFile = File(...)):
    """
    Parse a resume file and extract text, skills, and experience
    """
    try:
        # Read file content
        file_content = await file.read()
        
        # Create a file-like object that the Python parser expects
        class FileWrapper:
            def __init__(self, content, filename, content_type):
                self.content = content
                self.name = filename
                self.type = content_type
            
            def read(self):
                return self.content
        
        # Determine MIME type
        mime_type = file.content_type or "application/pdf"
        
        # Wrap the file
        wrapped_file = FileWrapper(file_content, file.filename, mime_type)
        
        # Parse the resume
        resume_data = parse_resume(wrapped_file)
        
        return {
            "success": True,
            "data": {
                "raw_text": resume_data["raw_text"],
                "skills": resume_data["skills"],
                "years_experience": resume_data["years_experience"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing resume: {str(e)}")

@app.post("/api/match-resume", response_model=ResumeMatchResponse)
async def match_resume_endpoint(
    file: UploadFile = File(...),
    job_title: str = "",
    company_name: str = "",
    job_description: str = "",
    location: str = "",
    experience_level: str = "",
    skills_required: str = "",
    industry: str = "",
    employment_mode: str = "",
    model_choice: str = "OpenAI"
):
    """
    Match a resume to a job posting using AI models
    """
    try:
        print(f"🔍 Processing resume: {file.filename}")
        print(f"📄 File type: {file.content_type}")
        
        # Read and parse the resume
        file_content = await file.read()
        print(f"✓ File read successfully, size: {len(file_content)} bytes")
        
        class FileWrapper:
            def __init__(self, content, filename, content_type):
                self.content = content
                self.name = filename
                self.type = content_type
                self._position = 0
            
            def read(self):
                # Return the full content and reset position
                self._position = 0
                return self.content
        
        mime_type = file.content_type or "application/pdf"
        wrapped_file = FileWrapper(file_content, file.filename, mime_type)
        
        # Parse resume
        print("📝 Parsing resume...")
        resume_data = parse_resume(wrapped_file)
        print(f"✓ Resume parsed, skills found: {len(resume_data.get('skills', []))}")
        
        # Prepare job data
        job_details = {
            "Job Title": job_title,
            "Company Name": company_name,
            "Job Description": job_description,
            "Location": location,
            "Experience Level": experience_level,
            "Skills Required": skills_required,
            "Industry": industry,
            "Employment Mode": employment_mode
        }
        
        print("🤖 Analyzing with OpenAI...")
        # Use OpenAI to analyze resume
        ai_result = analyze_resume_with_openai(resume_data["raw_text"], job_details)
        print(f"✓ AI analysis complete, match score: {ai_result.get('match_score', 0)}%")
        
        return ResumeMatchResponse(
            match_score=int(ai_result.get("match_score", 0)),
            skill_match=int(ai_result.get("skill_match_score", 0)),
            experience_match=int(ai_result.get("experience_match_score", 0)),
            matched_skills=ai_result.get("matched_skills", []),
            missing_skills=ai_result.get("missing_skills_from_resume", []),
            suggestions=ai_result.get("suggestions_for_candidate", ""),
            resume_data={
                "raw_text": resume_data["raw_text"],
                "skills": resume_data["skills"],
                "years_experience": resume_data["years_experience"]
            },
            gemini_suitability_summary=ai_result.get("suitability_summary")
        )
        
    except Exception as e:
        print(f"❌ ERROR in match_resume_endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error matching resume: {str(e)}")

@app.get("/api/health")
async def health_check():
    """
    Health check endpoint
    """
    return {"status": "healthy", "message": "API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
