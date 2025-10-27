"""
OpenAI-based resume analysis module
Replaces Gemini Pro with OpenAI GPT models
"""

import os
from openai import OpenAI
import json
import httpx

# Initialize OpenAI client
client = None

def initialize_openai(api_key: str = None):
    """Initialize the OpenAI client with API key"""
    global client
    try:
        if api_key is None:
            api_key = os.getenv("OPENAI_API_KEY")
        
        if not api_key:
            raise ValueError("OpenAI API key not provided")
        
        # Create a custom httpx client without proxies to avoid compatibility issues
        http_client = httpx.Client(
            timeout=60.0,
            follow_redirects=True
        )
        
        client = OpenAI(
            api_key=api_key,
            http_client=http_client
        )
    except Exception as e:
        if "proxies" in str(e):
            # Fallback: try without custom http_client
            client = OpenAI(api_key=api_key)
        else:
            raise

def analyze_resume_with_openai(resume_text: str, job_details: dict) -> dict:
    """
    Analyze a resume against a job posting using OpenAI GPT models
    
    Args:
        resume_text (str): Full text content of the resume
        job_details (dict): Dictionary containing job information
    
    Returns:
        dict: Analysis results including match scores and recommendations
    """
    global client
    
    if client is None:
        initialize_openai()
    
    # Create the prompt for OpenAI
    prompt = f"""
You are an expert HR recruiter analyzing resumes. Analyze the following resume against the job requirements and provide a detailed assessment.

JOB DETAILS:
- Job Title: {job_details.get('Job Title', 'N/A')}
- Company: {job_details.get('Company Name', 'N/A')}
- Experience Level: {job_details.get('Experience Level', 'N/A')}
- Required Skills: {job_details.get('Skills Required', 'N/A')}
- Location: {job_details.get('Location', 'N/A')}
- Employment Mode: {job_details.get('Employment Mode', 'N/A')}

JOB DESCRIPTION:
{job_details.get('Job Description', 'N/A')}

RESUME TEXT:
{resume_text}

Please analyze this resume and provide a JSON response with the following structure:
{{
    "match_score": <overall match score 0-100>,
    "skill_match_score": <skill match score 0-100>,
    "experience_match_score": <experience match score 0-100>,
    "matched_skills": [<list of skills from resume that match job requirements>],
    "missing_skills_from_resume": [<list of required skills missing from resume>],
    "suggestions_for_candidate": "<detailed suggestions for improving the application>",
    "suitability_summary": "<2-3 sentence summary of candidate's suitability>"
}}

Be objective and provide specific, actionable feedback.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # or "gpt-4" for better quality
            messages=[
                {"role": "system", "content": "You are an expert HR recruiter and resume analyst. Provide detailed, objective assessments of candidate-job fit."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,  # Lower temperature for more consistent results
            response_format={"type": "json_object"}
        )
        
        # Parse the JSON response
        result = json.loads(response.choices[0].message.content)
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"Error parsing OpenAI response as JSON: {e}")
        return {
            "error": "Failed to parse AI response",
            "match_score": 0,
            "skill_match_score": 0,
            "experience_match_score": 0,
            "matched_skills": [],
            "missing_skills_from_resume": [],
            "suggestions_for_candidate": "Unable to analyze resume at this time.",
            "suitability_summary": "Analysis failed"
        }
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return {
            "error": str(e),
            "match_score": 0,
            "skill_match_score": 0,
            "experience_match_score": 0,
            "matched_skills": [],
            "missing_skills_from_resume": [],
            "suggestions_for_candidate": "Unable to analyze resume at this time.",
            "suitability_summary": "Analysis failed"
        }
