from dotenv import load_dotenv
import google.generativeai as genai
import os

# Load environment variables from the .env file
load_dotenv()
# Retrieve the Gemini API key from environment variables

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Raise an error if the API key is missing
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set.")
# Initialize and configure the Gemini API model
# Set up Gemini API
def setup_gemini(api_key=None):
    api_key = api_key or GEMINI_API_KEY
    genai.configure(api_key=api_key)
    # Create a generative model instance
    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash"
    )
    
    return model
