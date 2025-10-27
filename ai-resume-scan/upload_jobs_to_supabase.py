# scripts/upload_jobs_to_supabase.py
import pandas as pd
from pathlib import Path
from datetime import datetime
import time

# Attempt to import Supabase configuration
try:
    from config.supabase_config import supabase_client, JOBS_TABLE_NAME
except ImportError:
    print(
        "Error: Could not import Supabase configuration.\n"
        "Ensure 'config.supabase_config' is available and SUPABASE_URL/KEY are set in .env.\n"
        "Run this script from the project root directory."
    )
    supabase_client = None
    JOBS_TABLE_NAME = "jobs"  # Default table name

CSV_FILE_PATH = Path(__file__).resolve().parent.parent / "data" / "job_dataset.csv"


def format_job_for_supabase(job_row_dict):
    """
    Prepares a job record from the CSV to match the Supabase table structure.
    Handles date formatting, missing values, and expected keys.
    """
    formatted_job = {}

    expected_columns = [
        "Job Title", "Company Name", "Job Description", "Location",
        "Job Type", "Salary Range", "Experience Level", "Skills Required",
        "Industry", "Posted Date", "Employment Mode"
    ]

    # Ensure all expected columns exist
    for col in expected_columns:
        formatted_job[col] = job_row_dict.get(col)

    # Format 'Posted Date' to ISO format
    posted_date_str = job_row_dict.get("Posted Date")
    if posted_date_str:
        try:
            dt_obj = pd.to_datetime(posted_date_str).date()
            formatted_job["Posted Date"] = dt_obj.isoformat()
        except ValueError:
            print(f"Warning: Unable to parse date '{posted_date_str}'. Setting as None.")
            formatted_job["Posted Date"] = None
    else:
        formatted_job["Posted Date"] = None

    # Supabase handles 'id', so remove it if present
    formatted_job.pop('id', None)

    # Convert any NaN values to None
    for key, value in formatted_job.items():
        if pd.isna(value):
            formatted_job[key] = None

    return formatted_job


def upload_csv_to_supabase():
    """Reads job_dataset.csv and uploads each record to Supabase 'jobs' table."""
    if not supabase_client:
        print("Supabase client not initialized. Aborting upload.")
        return

    if not CSV_FILE_PATH.exists():
        print(f"Error: CSV file not found at {CSV_FILE_PATH}")
        return

    try:
        df = pd.read_csv(CSV_FILE_PATH)
        print(f"Read {len(df)} rows from {CSV_FILE_PATH}")
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return

    success_count = 0
    fail_count = 0

    print(f"\nStarting upload to Supabase table '{JOBS_TABLE_NAME}'...")

    for idx, row in df.iterrows():
        job_dict = format_job_for_supabase(row.to_dict())
        print(f"  Uploading job: {job_dict.get('Job Title', 'N/A')}...")

        try:
            response = supabase_client.table(JOBS_TABLE_NAME).insert(job_dict).execute()

            if hasattr(response, 'error') and response.error:
                print(f"    Failed: {response.error.message}")
                fail_count += 1
            elif response.data:
                success_count += 1
            else:
                print(f"    Warning: No data returned for job '{job_dict.get('Job Title')}'. Response: {response}")
                fail_count += 1

        except Exception as e:
            print(f"    Exception during upload: {e}")
            fail_count += 1

        # Slight delay to avoid rate limits
        time.sleep(0.1)

    print("\n--- Upload Summary ---")
    print(f"Successfully uploaded: {success_count}")
    print(f"Failed uploads: {fail_count}")
    if fail_count > 0:
        print("Check the error messages above for details.")


if __name__ == "__main__":
    print("This script uploads job data from 'job_dataset.csv' to your Supabase table.")
    confirm = input("Proceed? This may duplicate data if run multiple times. (yes/no): ")
    if confirm.lower() == 'yes':
        upload_csv_to_supabase()
    else:
        print("Upload cancelled.")
