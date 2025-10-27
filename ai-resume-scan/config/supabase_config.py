import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
# Look for .env in the ai-resume-scan directory
config_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(config_dir)
env_path = os.path.join(project_root, '.env')
load_dotenv(dotenv_path=env_path)

# Retrieve Supabase credentials
SUPABASE_URL: str = os.environ.get("SUPABASE_URL")
SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY") 

# Validate that both environment variables are available
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase URL and Key must be set in environment variables or .env file.")

# Create and verify the Supabase client
try:
    supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("Supabase client has been successfully initialized.")
except Exception as e:
    print(f"Failed to initialize Supabase client: {e}")
    supabase_client = None


# Define constants for table names
JOBS_TABLE_NAME = "jobs"
PREDICTION_HISTORY_TABLE_NAME = "prediction_history"

