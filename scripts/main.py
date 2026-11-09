import argparse
import json
from datetime import date
from config import configure_output

from ai_titles import generate_headline
from wikipedia import get_current_events_page, extract_events, get_wikipedia_links
from locations import (
    resolve_locations, find_city_candidates, choose_city,
    location_terms, redact_locations, location_rejection_reason,
)
from database import make_event_id, build_event_rows, save_event


def process_event(event, event_date, source_page_url, dry_run=False):
    """Process either source through the same location, redaction and save rules."""
    raw_summary = event["summary"]
    links = get_wikipedia_links(event["html_node"])
    resolved = resolve_locations([link["title"] for link in links])
    cities = find_city_candidates(links, resolved)
    city = choose_city(cities)

    print("\nEVENT:", raw_summary)
    print("WIKIPEDIA LINKS:", links)
    print("RESOLVED LOCATIONS:", resolved)
    print("CITY CANDIDATES:", cities)
    print("CHOSEN LOCATION:", city)
    print("YEAR FOUND:", event_date.year)
    if city is None:
        print("REJECTED:", location_rejection_reason(cities, resolved))
        return "rejected"

    terms = location_terms(links, resolved)
    safe_summary = redact_locations(raw_summary, terms)
    raw_headline = event["headline"]
    category = event["category"]
    headline = raw_headline or generate_headline(safe_summary, category)
    safe_headline = redact_locations(headline, terms)
    event_id, source_key = make_event_id(
        event_date, city, event["source_urls"], raw_summary,
    )
    values = dict(
        event_id=event_id, source_key=source_key, event_date=event_date,
        headline=safe_headline, category=category, summary=safe_summary,
        city=city, raw_headline=raw_headline, raw_summary=raw_summary,
        source_urls=event["source_urls"], source_page_url=source_page_url,
    )
    if dry_run:
        event_row, answer_row = build_event_rows(**values)
        print("PREVIEW (no database writes):")
        print(json.dumps({"game_events": event_row, "event_answers": answer_row},
                         indent=2, ensure_ascii=False))
        return "previewed"

    save_event(**values)
    print(f"SAVED: {city['display_name']} -> {safe_summary[:70]}...")
    return "saved"


def process_day(day, dry_run=False):
    print(f"Processing {day}...")
    html, page_name = get_current_events_page(day)
    if html is None:
        print("No Wikipedia page found.")
        return
    events = extract_events(html)
    print(f"Found {len(events)} possible events.")
    counts = {"saved": 0, "rejected": 0, "previewed": 0}
    source_page_url = "https://en.wikipedia.org/wiki/" + page_name.replace(" ", "_")
    for event in events:
        status = process_event(event, day, source_page_url, dry_run=dry_run)
        counts[status] += 1
    print("Results:", counts)
    return counts


if __name__ == "__main__":
    configure_output()
    parser = argparse.ArgumentParser(description="Import one day of Wikipedia news.")
    parser.add_argument("--date", type=date.fromisoformat, default=date.today())
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    process_day(args.date, dry_run=args.dry_run)
