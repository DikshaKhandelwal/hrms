import random
import json
from models.gemini_model import analyze_resume_with_gemini
from models.custom_model_predictor import (
    predict_with_lstm,
    predict_with_transformer,
    load_lstm_model_and_tokenizer,
    load_transformer_model_and_tokenizer
)
from config.constants import (
    MODEL_GEMINI_PRO,
    MODEL_LSTM_CUSTOM,
    MODEL_TRANSFORMER_CUSTOM,
    MODEL_RULE_BASED
)

# Preload ML models at startup
print("Matcher.py: Preloading LSTM model and tokenizer...")
LOADED_LSTM_SUCCESS = load_lstm_model_and_tokenizer()
print(f"Matcher.py: LSTM pre-load result: {'Success' if LOADED_LSTM_SUCCESS else 'Failed/Not Found'}")

print("Matcher.py: Preloading Transformer model and tokenizer...")
LOADED_TRANSFORMER_SUCCESS = load_transformer_model_and_tokenizer()
print(f"Matcher.py: Transformer pre-load result: {'Success' if LOADED_TRANSFORMER_SUCCESS else 'Failed/Not Found'}")


def match_resume_to_job(resume_data, job_data, model_choice="Rule-Based Fallback"):
    """
    Matches a candidate's resume to a job posting using the selected model.

    Args:
        resume_data (dict): Parsed resume information.
            Expected keys: 
                - "raw_text" (str)
                - "skills" (list of strings)
                - "years_experience" (int)
        job_data (dict): Job posting information.
            Expected keys: 
                - "Job Description" (str)
                - "Skills Required" (comma-separated string)
                - "Experience Level" (str)
        model_choice (str): Model selection for matching.
            Options: "Gemini Pro", "LSTM Model", "Transformer Model", "Rule-Based Fallback"

    Returns:
        dict: Matching results including scores, matched/missing skills, and suggestions.
    """
    resume_text = resume_data.get("raw_text", "")
    resume_skills_set = set(s.lower() for s in resume_data.get("skills", []))
    resume_experience_years = resume_data.get("years_experience", 0)

    job_skills_str = job_data.get("Skills Required", "")
    job_skills_set = set(s.strip().lower() for s in job_skills_str.split(",") if s.strip())
    job_experience_level = job_data.get("Experience Level", "").lower()
    job_description_text = job_data.get("Job Description", "")

    if model_choice == MODEL_GEMINI_PRO:
        gemini_job_details = {
            "Job Title": job_data.get("Job Title", ""),
            "Company Name": job_data.get("Company Name", ""),
            "Job Description": job_description_text,
            "Location": job_data.get("Location", ""),
            "Experience Level": job_data.get("Experience Level", ""),
            "Skills Required": job_skills_str,
            "Industry": job_data.get("Industry", ""),
            "Employment Mode": job_data.get("Employment Mode", "")
        }

        gemini_response = analyze_resume_with_gemini(resume_text, gemini_job_details)

        if gemini_response and "error" not in gemini_response:
            return {
                "match_score": int(gemini_response.get("match_score", 0)),
                "skill_match": int(gemini_response.get("skill_match_score", gemini_response.get("skill_match", 0))),
                "experience_match": int(gemini_response.get("experience_match_score", gemini_response.get("experience_match", 0))),
                "missing_skills": gemini_response.get("missing_skills_from_resume", gemini_response.get("missing_skills", [])),
                "matched_skills": gemini_response.get("matched_skills", []),
                "suggestions": gemini_response.get("suggestions_for_candidate", gemini_response.get("suggestions", "Review job requirements for better alignment.")),
                "gemini_suitability_summary": gemini_response.get("suitability_summary", "")
            }
        else:
            print(f"Gemini Pro analysis failed or returned error: {gemini_response}")
            return _fallback_result(resume_skills_set, job_skills_set, resume_experience_years, job_experience_level)

    elif model_choice == MODEL_LSTM_CUSTOM:
        print("Using LSTM model for resume-job matching...")
        ml_match_score = predict_with_lstm(resume_text, job_description_text)
        if ml_match_score is not None:
            fallback = _fallback_result(resume_skills_set, job_skills_set, resume_experience_years, job_experience_level)
            fallback["match_score"] = int(ml_match_score)
            fallback["suggestions"] = "Overall score provided by LSTM; detailed skill/experience match is rule-based."
            return fallback
        else:
            print("LSTM prediction failed. Falling back to rule-based matching.")
            return _fallback_result(resume_skills_set, job_skills_set, resume_experience_years, job_experience_level)

    elif model_choice == MODEL_TRANSFORMER_CUSTOM:
        print("Using Transformer model for resume-job matching...")
        ml_match_score = predict_with_transformer(resume_text, job_description_text)
        if ml_match_score is not None:
            fallback = _fallback_result(resume_skills_set, job_skills_set, resume_experience_years, job_experience_level)
            fallback["match_score"] = int(ml_match_score)
            fallback["suggestions"] = "Overall score provided by Transformer; detailed skill/experience match is rule-based."
            return fallback
        else:
            print("Transformer prediction failed. Falling back to rule-based matching.")
            return _fallback_result(resume_skills_set, job_skills_set, resume_experience_years, job_experience_level)

    else:
        print(f"Model choice '{model_choice}' not recognized. Using rule-based fallback.")
        return _fallback_result(resume_skills_set, job_skills_set, resume_experience_years, job_experience_level)


def _fallback_result(resume_skills, job_skills, resume_experience_years, job_experience_level_raw):
    """
    Generates a rule-based matching result between resume and job.

    Args:
        resume_skills (set): Candidate's skills in lowercase.
        job_skills (set): Job-required skills in lowercase.
        resume_experience_years (int): Years of experience extracted from resume.
        job_experience_level_raw (str): Job experience level as string ("entry", "mid", "senior").

    Returns:
        dict: Matching results with scores, matched/missing skills, and suggestions.
    """
    matched_skills = resume_skills & job_skills
    missing_skills = job_skills - resume_skills

    skill_match_pct = int((len(matched_skills) / len(job_skills)) * 100) if job_skills else 0

    # Determine required experience based on job level
    job_exp_min = 0
    if "mid" in job_experience_level_raw:
        job_exp_min = 2
    elif "senior" in job_experience_level_raw:
        job_exp_min = 5

    # Compute experience match percentage
    if resume_experience_years >= job_exp_min:
        experience_match_pct = 100
    elif job_exp_min > 0 and resume_experience_years > 0:
        experience_match_pct = int((resume_experience_years / job_exp_min) * 70)
        experience_match_pct = max(0, min(experience_match_pct, 80))
    elif job_exp_min == 0:
        experience_match_pct = 100
    else:
        experience_match_pct = 10

    # Ensure percentages are within 0-100
    skill_match_pct = max(0, min(skill_match_pct, 100))
    experience_match_pct = max(0, min(experience_match_pct, 100))

    overall_score = int(0.7 * skill_match_pct + 0.3 * experience_match_pct)
    overall_score = max(0, min(overall_score, 100))

    return {
        "match_score": overall_score,
        "skill_match": skill_match_pct,
        "experience_match": experience_match_pct,
        "missing_skills": list(missing_skills),
        "matched_skills": list(matched_skills),
        "suggestions": "Highlight transferable skills or gain experience in missing areas."
    }
