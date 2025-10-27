import pandas as pd
from datetime import datetime
from config.supabase_config import supabase_client, JOBS_TABLE_NAME
from config.constants import COMMON_SKILLS


def load_jobs() -> pd.DataFrame:
    """Retrieve job postings from Supabase."""
    if not supabase_client:
        print("Supabase client is not initialized. Cannot retrieve jobs.")
        return pd.DataFrame()

    try:
        response = supabase_client.table(JOBS_TABLE_NAME).select("*").order("created_at", desc=True).execute()
        if response.data:
            df = pd.DataFrame(response.data)
            if 'posted_date' in df.columns:
                # Convert posted_date to 'YYYY-MM-DD' format
                df['posted_date'] = pd.to_datetime(df['posted_date'], errors='coerce').dt.strftime('%Y-%m-%d')
            return df
        else:
            print("No job data found or Supabase returned an empty response.")
            return pd.DataFrame()
    except Exception as e:
        print(f"Error fetching jobs from Supabase: {e}")
        return pd.DataFrame()


def add_job(job_dict: dict) -> bool:
    """Insert a new job posting into Supabase. Returns True if successful."""
    if not supabase_client:
        print("Supabase client is not initialized. Cannot add job.")
        return False

    try:
        job_dict.pop('id', None)  # Remove ID if present

        response = supabase_client.table(JOBS_TABLE_NAME).insert(job_dict).execute()
        if response.data:
            print(f"Job added successfully with ID: {response.data[0]['id']}")
            return True
        else:
            if hasattr(response, 'error') and response.error:
                print(f"Failed to add job. Error: {response.error.message}")
            else:
                print(f"Failed to add job. No data returned. Full response: {response}")
            return False
    except Exception as e:
        print(f"Error adding job to Supabase: {e}")
        return False


def update_job(job_id: int, updated_job_data: dict) -> bool:
    """Update an existing job posting by ID. Returns True if successful."""
    if not supabase_client:
        print("Supabase client is not initialized. Cannot update job.")
        return False

    try:
        updated_job_data.pop('id', None)  # Remove ID if present

        response = supabase_client.table(JOBS_TABLE_NAME).update(updated_job_data).eq("id", job_id).execute()
        if response.data:
            print(f"Job with ID {job_id} updated successfully.")
            return True
        else:
            if hasattr(response, 'error') and response.error:
                print(f"Failed to update job {job_id}. Error: {response.error.message}")
            elif len(response.data) == 0:
                print(f"No matching job found for ID {job_id}, or no changes were made.")
            else:
                print(f"Failed to update job {job_id}. Response: {response}")
            return False
    except Exception as e:
        print(f"Error updating job {job_id}: {e}")
        return False


def delete_job(job_id: int) -> bool:
    """Delete a job posting from Supabase by its ID. Returns True if successful."""
    if not supabase_client:
        print("Supabase client is not initialized. Cannot delete job.")
        return False

    try:
        response = supabase_client.table(JOBS_TABLE_NAME).delete().eq("id", job_id).execute()
        if response.data:
            print(f"Job with ID {job_id} deleted successfully.")
            return True
        else:
            if hasattr(response, 'error') and response.error:
                print(f"Failed to delete job {job_id}. Error: {response.error.message}")
            elif len(response.data) == 0:
                print(f"No job found with ID {job_id}.")
            else:
                print(f"Failed to delete job {job_id}. Response: {response}")
            return False
    except Exception as e:
        print(f"Error deleting job {job_id}: {e}")
        return False


def get_job_by_id(job_id: int) -> dict | None:
    """Retrieve a single job posting by its ID."""
    if not supabase_client:
        print("Supabase client is not initialized. Cannot fetch job by ID.")
        return None

    try:
        response = supabase_client.table(JOBS_TABLE_NAME).select("*").eq("id", job_id).single().execute()
        if response.data:
            return response.data
        else:
            return None
    except Exception as e:
        print(f"Error fetching job with ID {job_id}: {e}")
        return None


def get_all_skills() -> list:
    """
    Compile a list of all unique skills from Supabase jobs and combine with predefined common skills.
    """
    df = load_jobs()
    all_skills_set = set(skill.lower() for skill in COMMON_SKILLS)

    if "Skills Required" not in df.columns or df.empty:
        print("No 'Skills Required' column found or no job data loaded. Returning only common skills.")
        return list(all_skills_set)

    for skills_entry in df["Skills Required"].dropna():
        for skill in str(skills_entry).split(","):
            cleaned_skill = skill.strip().lower()
            if cleaned_skill:
                all_skills_set.add(cleaned_skill)

    return list(all_skills_set)


def format_job_short(job_row: pd.Series) -> str:
    """Generate a concise string representation of a job posting."""
    title = job_row.get('Job Title', 'N/A')
    company = job_row.get('Company Name', 'N/A')
    location = job_row.get('Location', 'N/A')
    job_type = job_row.get('Job Type', 'N/A')
    experience = job_row.get('Experience Level', 'N/A')
    salary = job_row.get('Salary Range', 'N/A')
    posted_date_val = job_row.get('posted_date', 'N/A')

    return (
        f"**{title}** | {company} | {location} | {job_type}\n"
        f"Experience: {experience} | Salary: {salary}\n"
        f"Posted on: {posted_date_val}"
    )


def truncate_description(desc: str, limit: int = 200) -> str:
    """Truncate job description to a specified character limit."""
    return desc[:limit] + "..." if len(desc) > limit else desc
