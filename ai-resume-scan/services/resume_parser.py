import docx2txt
import pdfplumber
import re
import io
from .job_service import get_all_skills

# Load the list of known skills from job postings
SKILLS = get_all_skills()


def extract_text(file):
    """
    Extract text content from a PDF or Word document.
    
    Args:
        file: Uploaded file object.
    
    Returns:
        str: Extracted text from the file, or empty string if unsupported.
    """
    if file.type == "application/pdf":
        with pdfplumber.open(io.BytesIO(file.read())) as pdf:
            # Extract text from each page and join with newlines
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    elif file.type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                       "application/msword"]:
        return docx2txt.process(file)
    else:
        return ""


def extract_skills(text):
    """
    Identify skills mentioned in the text by matching against a known skills list.
    
    Args:
        text (str): Raw text from resume.
    
    Returns:
        list: Unique skills found in the resume.
    """
    words_in_text = set(re.findall(r'\b\w+\b', text))
    found_skills = [skill for skill in SKILLS if skill.lower() in {w.lower() for w in words_in_text}]
    return list(set(found_skills))


def extract_experience(text):
    """
    Extract the number of years of experience from resume text.
    
    Looks for patterns like 'X years of experience', 'experience of X years', or 'worked for X years'.
    
    Args:
        text (str): Resume text.
    
    Returns:
        int: Years of experience found, or 0 if none detected.
    """
    patterns = [
        r"(\d+)\+?\s+years? of experience",
        r"experience\s+of\s+(\d+)\s+years",
        r"worked\s+for\s+(\d+)\s+years"
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return int(match.group(1))
    return 0


def parse_resume(resume_file):
    """
    Parse a resume file to extract raw text, skills, and years of experience.
    
    Args:
        resume_file: Uploaded resume file object.
    
    Returns:
        dict: Parsed information including:
            - "raw_text": Full text of resume
            - "skills": List of identified skills
            - "years_experience": Number of years of experience detected
    """
    text = extract_text(resume_file)

    return {
        "raw_text": text,
        "skills": extract_skills(text),
        "years_experience": extract_experience(text),
    }
