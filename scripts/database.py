import os
import hashlib
import uuid

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SECRET_KEY"]
)


def make_event_id(
    event_date,
    city,
    source_urls,
    raw_summary
):
    fingerprint = "|".join([
        event_date.isoformat(),
        city["page"],
        *sorted(source_urls),
        raw_summary,
    ])

    source_key = hashlib.sha256(
        fingerprint.encode("utf-8")
    ).hexdigest()

    event_id = uuid.uuid5(
        uuid.NAMESPACE_URL,
        "wheres-the-news:" + source_key
    )

    return str(event_id), source_key


def save_event(
    event_id,
    source_key,
    event_date,
    headline,
    category,
    summary,
    city,
    raw_headline,
    raw_summary,
    source_urls,
    source_page_url,
):
    event_row = {
        "id": event_id,
        "source_key": source_key,
        "event_date": event_date.isoformat(),
        "category": category,
        "headline": headline,
        "summary": summary,
    }
    supabase.table("game_events").upsert(
        event_row,
        on_conflict="source_key"
    ).execute()

    answer_row = {
        "event_id": event_id,

        "location_name": city["display_name"],

        "latitude": city["lat"],
        "longitude": city["lon"],

        "country_code": city.get("country"),
        "region_code": city.get("region"),

        "wikipedia_page": city["page"],
        "wikidata_id": city.get("wikidata_id"),

        "raw_headline": raw_headline,
        "raw_summary": raw_summary,

        "source_urls": source_urls,
        "source_page_url": source_page_url,

        "location_confidence": 1.0,
    }

    supabase.table("event_answers").upsert(
        answer_row,
        on_conflict="event_id"
    ).execute()