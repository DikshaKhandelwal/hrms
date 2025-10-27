# ui/theme.py
import streamlit as st
from pathlib import Path

# Define the base path where theme CSS files are stored
THEME_PATH = Path("assets/themes")


def load_css(file_path):
    """
    Reads a CSS file and wraps its contents in a <style> tag.

    Args:
        file_path (Path or str): Path to the CSS file.

    Returns:
        str: CSS content wrapped in <style> tags for injecting into Streamlit.
    """
    with open(file_path) as f:
        return f"<style>{f.read()}</style>"


def apply_custom_theme(theme_mode="Light"):
    """
    Applies a custom theme to the Streamlit app by loading the corresponding CSS file.

    Args:
        theme_mode (str): Either "Light" or "Dark". Defaults to "Light".
    
    Behavior:
        - Loads the CSS file for the selected theme.
        - Injects the CSS into the Streamlit app using st.markdown.
    """
    # Choose CSS file based on selected theme mode
    if theme_mode == "Dark":
        css = load_css(THEME_PATH / "dark.css")
    else:
        css = load_css(THEME_PATH / "light.css")

    # Apply CSS to the app
    st.markdown(css, unsafe_allow_html=True)
