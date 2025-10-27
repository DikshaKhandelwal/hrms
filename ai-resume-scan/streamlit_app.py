import streamlit as st
from ui.theme import apply_custom_theme
from hide_sidebar.pages import hr_page, applicant_page, dashboard, data_visualization_page
import app
from config.constants import (
    HOME, HR_PORTAL, APPLICANT_PORTAL, DASHBOARD, DATA_VISUALIZATION,
    SYSTEM_THEME, LIGHT_THEME, DARK_THEME
)
import sys
sys.modules["torch.classes"] = None
# === Page Configuration ===
st.set_page_config(
    page_title="AI-powered Resume Scanning System",
    page_icon="📄",
    layout="wide",
    initial_sidebar_state="expanded"
)

# === Sidebar Theme Selector ===
theme = st.sidebar.selectbox(
    "Select Theme", options=[SYSTEM_THEME, LIGHT_THEME, DARK_THEME], index=0
)

if theme == LIGHT_THEME:
    apply_custom_theme("Light")
elif theme == DARK_THEME:
    apply_custom_theme("Dark")
# SYSTEM_THEME is handled automatically by Streamlit; no custom theme needed

# === Navigation Pages ===
PAGES = {
    HOME: app,
    HR_PORTAL: hr_page,
    APPLICANT_PORTAL: applicant_page,
    DASHBOARD: dashboard,
    DATA_VISUALIZATION: data_visualization_page
}

# Initialize session state for selected page
if "selected_page" not in st.session_state:
    st.session_state.selected_page = HOME

# Sidebar navigation selector
selected_page = st.sidebar.selectbox(
    "Navigation", options=list(PAGES.keys()),
    index=list(PAGES.keys()).index(st.session_state.selected_page)
)

# Update session state and run the selected page
st.session_state.selected_page = selected_page
PAGES[selected_page].run()
