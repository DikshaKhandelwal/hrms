import streamlit as st
import pandas as pd
import plotly.express as px
import os
from datetime import datetime, time
from config.supabase_config import supabase_client, PREDICTION_HISTORY_TABLE_NAME

def load_prediction_history_from_supabase() -> pd.DataFrame:
    """Retrieve prediction history data from the Supabase table."""
    if not supabase_client:
        st.error("Supabase client not initialized. Unable to load prediction history.")
        print("Supabase client not initialized in load_prediction_history_from_supabase.")
        return pd.DataFrame()

    try:
        response = supabase_client.table(PREDICTION_HISTORY_TABLE_NAME).select("*").order("timestamp", desc=True).execute()
        if response.data:
            df = pd.DataFrame(response.data)
            df["timestamp"] = pd.to_datetime(df["timestamp"])

            numeric_cols = ['match_score', 'skill_match_score', 'experience_match_score', 'missing_skills_count']
            for col in numeric_cols:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            return df
        else:
            return pd.DataFrame()
    except Exception as e:
        st.error(f"Error retrieving prediction history from Supabase: {e}")
        print(f"Error retrieving prediction history from Supabase: {e}")
        return pd.DataFrame()

def run():
    st.title("Dashboard: Prediction Insights and Model Comparison")
    st.markdown("Analyze resume-to-job matches, evaluate model performance, and explore performance trends.")
    st.markdown("---")

    df = load_prediction_history_from_supabase()

    if df.empty:
        st.info("Prediction history is currently empty. Please analyze resumes in the Applicant Portal to view data.")
        return

    st.sidebar.header("Filter Options")

    min_date = df["timestamp"].min().date() if not df.empty else datetime.now().date()
    max_date = df["timestamp"].max().date() if not df.empty else datetime.now().date()

    selected_date_range = st.sidebar.date_input(
        "Select Date Range",
        value=(min_date, max_date),
        min_value=min_date,
        max_value=max_date,
    )

    start_date, end_date = selected_date_range
    start_datetime = datetime.combine(start_date, time.min)
    end_datetime = datetime.combine(end_date, time.max)
    df["timestamp"] = df["timestamp"].dt.tz_localize(None)

    job_titles = ["All"] + sorted(df["job_title"].astype(str).unique().tolist())
    selected_job = st.sidebar.selectbox("Select Job Title", job_titles, key="dashboard_job_filter")

    model_names = ["All"] + sorted(df["model_used"].astype(str).unique().tolist())
    selected_model_filter = st.sidebar.selectbox("Select Model", model_names, key="dashboard_model_filter")

    filtered_df = df[
        (df["timestamp"] >= start_datetime) & (df["timestamp"] <= end_datetime)
    ]
    if selected_job != "All":
        filtered_df = filtered_df[filtered_df["job_title"] == selected_job]
    if selected_model_filter != "All":
        filtered_df = filtered_df[filtered_df["model_used"] == selected_model_filter]

    if filtered_df.empty:
        st.warning("No data available for the selected filters.")
        return

    st.subheader("Overall Performance Metrics")

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Total Predictions (Filtered)", len(filtered_df))
    with col2:
        avg_match_score = filtered_df['match_score'].mean()
        st.metric("Average Match Score", f"{avg_match_score:.2f}%" if not pd.isna(avg_match_score) else "N/A")
    with col3:
        if not filtered_df.empty and 'model_used' in filtered_df.columns and 'match_score' in filtered_df.columns:
            top_model_series = filtered_df.groupby("model_used")["match_score"].mean()
            if not top_model_series.empty:
                top_model_name = top_model_series.idxmax()
                top_model_score = top_model_series.max()
                st.metric("Top Model (Average)", f"{top_model_name} ({top_model_score:.1f}%)")
            else:
                st.metric("Top Model", "N/A")
        else:
            st.metric("Top Model", "N/A")

    st.markdown("---")
    st.subheader("Model-wise Comparison")

    if 'model_used' in filtered_df.columns and 'match_score' in filtered_df.columns:
        model_summary = filtered_df.groupby("model_used")["match_score"].agg(
            count='count',
            mean_score='mean',
            median_score='median',
            min_score='min',
            max_score='max',
            std_dev='std'
        ).reset_index()
        model_summary = model_summary.sort_values(by="mean_score", ascending=False)
        model_summary = model_summary.round(2)

        st.dataframe(
            model_summary,
            column_config={
                "model_used": st.column_config.TextColumn("Model"),
                "count": st.column_config.NumberColumn("Predictions", format="%d"),
                "mean_score": st.column_config.NumberColumn("Average Match Score (%)"),
                "median_score": st.column_config.NumberColumn("Median Score (%)"),
                "min_score": st.column_config.NumberColumn("Min Score (%)"),
                "max_score": st.column_config.NumberColumn("Max Score (%)"),
                "std_dev": st.column_config.NumberColumn("Standard Deviation"),
            },
            use_container_width=True,
            hide_index=True
        )
    else:
        st.info("Insufficient data to create model comparison table.")

    if not filtered_df.empty and 'model_used' in filtered_df.columns and 'match_score' in filtered_df.columns:
        model_avg_scores = filtered_df.groupby("model_used")["match_score"].mean().reset_index()
        if not model_avg_scores.empty:
            bar_fig_model_avg = px.bar(
                model_avg_scores.sort_values(by="match_score", ascending=False),
                x="model_used",
                y="match_score",
                color="model_used",
                title="Average Match Score by Model",
                labels={"model_used": "Model", "match_score": "Average Match Score (%)"},
                text='match_score'
            )
            bar_fig_model_avg.update_traces(texttemplate='%{text:.2f}%', textposition='outside')
            bar_fig_model_avg.update_layout(uniformtext_minsize=8, uniformtext_mode='hide', showlegend=False)
            st.plotly_chart(bar_fig_model_avg, use_container_width=True)
        else:
            st.info("No sufficient data to display average match scores.")

    if not filtered_df.empty and 'model_used' in filtered_df.columns and 'match_score' in filtered_df.columns:
        if len(filtered_df["model_used"].unique()) > 0:
            box_fig_score_dist = px.box(
                filtered_df.sort_values(by="model_used"),
                x="model_used",
                y="match_score",
                color="model_used",
                title="Distribution of Match Scores by Model",
                labels={"model_used": "Model", "match_score": "Match Score (%)"},
                points="outliers"
            )
            box_fig_score_dist.update_layout(showlegend=False)
            st.plotly_chart(box_fig_score_dist, use_container_width=True)
        else:
            st.info("Not enough distinct models to show score distribution.")

    st.markdown("---")
    st.subheader("Trend Analysis Over Time")

    if not filtered_df.empty and 'timestamp' in filtered_df.columns and 'match_score' in filtered_df.columns and 'model_used' in filtered_df.columns:
        if len(filtered_df) > 1:
            trend_fig = px.line(
                filtered_df.sort_values("timestamp"),
                x="timestamp",
                y="match_score",
                color="model_used",
                title="Match Score Trends Over Time",
                markers=True,
                labels={"timestamp": "Date", "match_score": "Match Score (%)", "model_used": "Model"}
            )
            st.plotly_chart(trend_fig, use_container_width=True)
        elif len(filtered_df) == 1:
            st.info("Only one record available; trend visualization requires more data.")
        else:
            st.info("No trend data available for the current filters.")

    st.markdown("---")
    st.subheader("Skill Insights from Rule-Based Analysis")

    if 'missing_skills_list' in filtered_df.columns:
        skills_series = filtered_df["missing_skills_list"].astype(str).str.split(", ").explode().str.strip()
        skills_series = skills_series[skills_series != ""]

        if not skills_series.empty:
            top_missing_skills = skills_series.value_counts().head(10).reset_index()
            top_missing_skills.columns = ["Skill", "Frequency"]
            st.write("Top 10 Most Frequently Missing Skills (Filtered Data):")
            st.dataframe(top_missing_skills, use_container_width=True, hide_index=True)
        else:
            st.info("No missing skill information available for current filters.")
    else:
        st.info("Missing skills data not found in the current dataset.")

    st.markdown("---")
    if not df.empty:
        csv_export = df.to_csv(index=False).encode('utf-8')
        st.download_button(
            label="Download Complete Prediction History (CSV)",
            data=csv_export,
            file_name="full_prediction_history.csv",
            mime="text/csv",
        )
