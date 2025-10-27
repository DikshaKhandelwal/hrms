import re
import json
from config.settings import setup_gemini

def analyze_resume_with_gemini(resume_text_input, job_details_dict_input):
    """
    Evaluate a candidate's resume against a job description using the Gemini Pro model.

    Args:
        resume_text_input (str): Raw text content of the resume.
        job_details_dict_input (dict): Job details dictionary containing keys like 
                                       "Job Title", "Job Description", "Skills Required", etc.

    Returns:
        dict: Analysis results from Gemini or an error dictionary if evaluation fails.
    """
    try:
        # Initialize Gemini model instance
        model_instance = setup_gemini()
        if not model_instance:
            return {"error": "Failed to initialize Gemini model using setup_gemini().", "raw_response": ""}
    except Exception as setup_error:
        print(f"Error initializing Gemini model: {setup_error}")
        return {"error": f"Gemini setup failed: {setup_error}", "raw_response": ""}

    # Build job description prompt
    job_description_prompt_text = f"""
    Job Title: {job_details_dict_input.get("Job Title", "N/A")}
    Company: {job_details_dict_input.get("Company Name", "N/A")}
    Full Job Description: {job_details_dict_input.get("Job Description", "N/A")}
    Location: {job_details_dict_input.get("Location", "N/A")}
    Experience Level Required: {job_details_dict_input.get("Experience Level", "N/A")}
    Skills Required: {job_details_dict_input.get("Skills Required", "N/A")}
    Industry: {job_details_dict_input.get("Industry", "N/A")}
    Employment Mode: {job_details_dict_input.get("Employment Mode","N/A")}
    """

    prompt = (
        "You are an expert Talent Acquisition Specialist and Resume Analyzer AI. "
        "Analyze the candidate's resume against the job description carefully. "
        "Focus on skill alignment, experience relevance, and overall suitability. "
        "Treat skill variations equivalently (e.g., ReactJS, React JS, React are identical). "
        "Return the output as a JSON object.\n\n"
        f"Job Description Details:\n{job_description_prompt_text}\n\n"
        f"Candidate's Resume:\n{resume_text_input}\n\n"
        "Provide a JSON object with these keys (percentages as integers 0-100):\n"
        "{\n"
        '  "match_score": (overall fit, 0-100),\n'
        '  "skill_match_score": (skill alignment, 0-100),\n'
        '  "experience_match_score": (experience alignment, 0-100),\n'
        '  "identified_candidate_skills": ["list", "of", "candidate", "skills"],\n'
        '  "required_skills_from_jd": ["list", "of", "required", "skills"],\n'
        '  "matched_skills": ["list", "of", "common", "skills"],\n'
        '  "missing_skills_from_resume": ["list", "of", "missing", "skills"],\n'
        '  "candidate_experience_summary": "(Brief summary of candidate experience relevant to role)",\n'
        '  "job_experience_requirement_summary": "(Brief summary of job experience requirements)",\n'
        '  "suitability_summary": "(Concise overall fit assessment, strengths, weaknesses)",\n'
        '  "suggestions_for_candidate": "(1-2 actionable improvement suggestions)"\n'
        "}"
    )

    try:
        response = model_instance.generate_content(prompt)
        if not response.parts:
            print("Gemini returned no content parts.")
            return {"error": "Gemini response empty", "raw_response": str(response)}

        # Aggregate text from all parts
        response_text = ""
        for part in response.parts:
            try:
                response_text += part.text
            except ValueError:
                print(f"Skipping non-text part in Gemini response: {type(part)}")
                continue
        response_text = response_text.strip()
        if not response_text:
            print("Gemini response text is empty after stripping.")
            return {"error": "Empty response text", "raw_response": str(response)}

        # Extract JSON block from response
        json_block_match = re.search(r'```json\s*(\{.*?\})\s*```', response_text, re.DOTALL)
        json_str = ""
        if json_block_match:
            json_str = json_block_match.group(1)
        else:
            first_brace = response_text.find('{')
            last_brace = response_text.rfind('}')
            if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
                json_str = response_text[first_brace : last_brace+1]
            else:
                print("No valid JSON block found in Gemini response.")
                return {"error": "Invalid JSON structure", "raw_response": "Response did not contain JSON block."}

        result = json.loads(json_str)
        return result

    except json.JSONDecodeError as decode_error:
        print(f"Failed to decode JSON from Gemini response: {decode_error}")
        problematic_json_str = json_str if 'json_str' in locals() and json_str else "Not extracted"
        print("Problematic JSON string:", problematic_json_str)
        return {"error": f"JSONDecodeError: {decode_error}", "raw_response": "JSON decoding failed."}
    except Exception as unexpected_error:
        print(f"Unexpected error in analyze_resume_with_gemini: {unexpected_error}")
        return {"error": f"Unexpected error: {unexpected_error}", "raw_response": "Error during Gemini call."}
