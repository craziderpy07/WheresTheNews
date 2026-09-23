"""Fetch current headlines, remove location giveaways with an AI model, and store them in Supabase.

Required environment variables:
  NEWS_API_KEY
  AI_API_KEY
  AI_MODEL
  AI_API_URL
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

This script is scaffolding for the data pipeline. It is not counted as a completed gameplay requirement in the 35% milestone.
"""

import json
import os
import re
from datetime import date

import requests
from supabase import create_client

NEWS_ENDPOINT = "https://newsapi.org/v2/top-headlines"


def fetch_headlines(limit=10):
    response = requests.get(
        NEWS_ENDPOINT,
        params={"language": "en", "pageSize": limit, "apiKey": os.environ["NEWS_API_KEY"]},
        timeout=30,
    )
    response.raise_for_status()
    return response.json().get("articles", [])


def summarize_without_location(title, description):
    prompt = f"""
You prepare clues for a geography news game.
Summarize the news item in 1-2 concise English sentences.
Remove or generalize any city, state/province, country, landmark, demonym, local institution,
or other wording that directly gives away the event location.
Do not invent facts. Return only the clue text.

Title: {title}
Description: {description or ''}
""".strip()

    api_url = os.environ["AI_API_URL"]
    headers = {
        "Authorization": f"Bearer {os.environ['AI_API_KEY']}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": os.environ["AI_MODEL"],
        "input": prompt,
    }
    response = requests.post(api_url, headers=headers, json=payload, timeout=60)
    response.raise_for_status()
    data = response.json()

    # Supports the common Responses API structure. Adjust this adapter if another AI provider is used.
    if data.get("output_text"):
        return data["output_text"].strip()
    for item in data.get("output", []):
        for content in item.get("content", []):
            if content.get("text"):
                return content["text"].strip()
    raise RuntimeError("AI response did not contain text.")


def main():
    supabase = create_client(
        os.environ["NEXT_PUBLIC_SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )

    inserted = 0
    for article in fetch_headlines():
        title = article.get("title") or ""
        if not title or title == "[Removed]":
            continue
        clue = summarize_without_location(title, article.get("description"))
        row = {
            "source_name": (article.get("source") or {}).get("name"),
            "source_url": article.get("url"),
            "original_title": title,
            "summarized_clue": re.sub(r"\s+", " ", clue).strip(),
            "event_date": (article.get("publishedAt") or str(date.today()))[:10],
            "is_historical": False,
        }
        supabase.table("daily_headlines").insert(row).execute()
        inserted += 1

    print(json.dumps({"inserted": inserted}))


if __name__ == "__main__":
    main()
