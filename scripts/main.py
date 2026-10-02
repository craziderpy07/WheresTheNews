from datetime import date

from ai_titles import generate_headline

from wikipedia import (
    get_current_events_page,
    extract_events,
    get_wikipedia_links,
)

from locations import (
    resolve_locations,
    find_city_candidates,
    choose_city,
    location_terms,
    redact_locations,
)

from database import (
    make_event_id,
    save_event,
)


def process_day(day):
    print(f"Processing {day}...")

    html, page_name = get_current_events_page(day)

    if html is None:
        print("No Wikipedia page found.")
        return

    events = extract_events(html)

    print(f"Found {len(events)} possible events.")

    accepted = 0
    rejected = 0

    for event in events:

        raw_summary = event["summary"]

        # -------------------------
        # Find Wikipedia links
        # -------------------------

        links = get_wikipedia_links(
            event["html_node"]
        )

        titles = [
            link["title"]
            for link in links
        ]

        # -------------------------
        # Find geographic pages
        # -------------------------

        resolved = resolve_locations(titles)

        cities = find_city_candidates(
            links,
            resolved
        )


        city = choose_city(cities)

        print("\n==============================")
        print("EVENT:", raw_summary)

        print("\nWIKIPEDIA LINKS:")
        for link in links:
            print(" ", link)

        print("\nRESOLVED LOCATIONS:")
        for title, location in resolved.items():
            print(" ", title, "->", location)

        print("\nCITY CANDIDATES:")
        for candidate in cities:
            print(" ", candidate)

        print("\nCHOSEN CITY:")
        print(city)

        # No clear city = don't use it
        if city is None:
            rejected += 1
            continue

        # -------------------------
        # Redact location names
        # -------------------------

        terms = location_terms(
            links,
            resolved
        )

        safe_summary = redact_locations(
            raw_summary,
            terms
        )

        # -------------------------
        # Headline and category
        # -------------------------

        raw_headline = event["headline"]
        category = event["category"]

        if raw_headline:
            safe_headline = redact_locations(
                raw_headline,
                terms
            )
        else:
            safe_headline = generate_headline(
                safe_summary,
                category
            )

        # -------------------------
        # Make stable ID
        # -------------------------

        event_id, source_key = make_event_id(
            day,
            city,
            event["source_urls"],
            raw_summary,
        )

        # -------------------------
        # Save to Supabase
        # -------------------------

        source_page_url = (
            "https://en.wikipedia.org/wiki/"
            + page_name.replace(" ", "_")
        )

        save_event(
            event_id=event_id,
            source_key=source_key,
            event_date=day,
            headline=safe_headline,
            category=category,
            summary=safe_summary,
            city=city,
            raw_headline=raw_headline,
            raw_summary=raw_summary,
            source_urls=event["source_urls"],
            source_page_url=source_page_url,
        )

        print("\n------------------------------")
        print("LOCATION:", city["display_name"])
        print("COORDS:", city["lat"], city["lon"])
        print("ORIGINAL:", raw_summary)
        print("GAME:", safe_summary)

        accepted += 1

        print(
            f"SAVED: {city['display_name']} -> "
            f"{safe_summary[:70]}..."
        )

        raw_headline = event["headline"]
        category = event["category"]

        if raw_headline:
            safe_headline = redact_locations(
                raw_headline,
                terms
            )

        else:
            safe_headline = generate_headline(
                safe_summary,
                category
            )

        save_event(
            event_id=event_id,
            source_key=source_key,
            event_date=day,
            headline=safe_headline,
            category=category,
            summary=safe_summary,
            city=city,
            raw_headline=raw_headline,
            raw_summary=raw_summary,
            source_urls=event["source_urls"],
            source_page_url=source_page_url,
        )

        print("\n------------------------------")
        print("CATEGORY:", category)
        print("HEADLINE:", safe_headline)
        print("LOCATION:", city["display_name"])
        print("ORIGINAL:", raw_summary)
        print("GAME:", safe_summary)

    print()
    print(f"Accepted: {accepted}")
    print(f"Rejected: {rejected}")


if __name__ == "__main__":
    process_day(date(2026, 9, 28))