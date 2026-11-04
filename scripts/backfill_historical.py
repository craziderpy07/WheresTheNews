"""Import historical daily news or dated Wikipedia year-page events."""

import argparse
from datetime import date, timedelta
import time
from config import configure_output

from historical import extract_year_events, get_year_page
from main import process_day, process_event


def backfill(start_date, end_date, dry_run=False):
    time.sleep(10)
    if start_date > end_date:
        raise ValueError("Start date must not exceed end date.")
    if end_date >= date(2024, 10, 1):
        raise ValueError("Historical dates must be before 2024-10-01.") #After this date, events are already saved
    total_days = (end_date - start_date).days + 1
    failed = []
    for offset in range(total_days):
        current = start_date + timedelta(days=offset)
        print(f"\nDAY {offset + 1}/{total_days}: {current}")
        try:
            process_day(current, dry_run=dry_run)
        except Exception as error:
            failed.append(current.isoformat())
            print(f"FAILED {current}: {error}")
        time.sleep(0.5)
    print("Failed dates (rerun these ranges):", failed)
    return failed


def backfill_years(start_year, end_year, dry_run=False):
    date(start_year, 1, 1)
    date(end_year, 1, 1)
    if start_year > end_year:
        raise ValueError("Start year must not exceed end year.")
    if end_year >= 2006:
        raise ValueError("Historical years must be before 2006.")
    failed = []
    for year in range(start_year, end_year + 1):
        print(f"\nYEAR {year}")
        try:
            html, page_name = get_year_page(year)
            if html is None:
                print(f"SKIPPED {year}: no Wikipedia page found.")
                continue
            events = extract_year_events(html, year)
            print(f"Found {len(events)} dated events.")
            counts = {"saved": 0, "rejected": 0, "previewed": 0, "failed": 0}
            source_url = "https://en.wikipedia.org/wiki/" + page_name.replace(" ", "_")
            for event_date, event in events:
                try:
                    status = process_event(event, event_date, source_url, dry_run=dry_run)
                    counts[status] += 1
                except Exception as error:
                    counts["failed"] += 1
                    if year not in failed:
                        failed.append(year)
                    print(f"FAILED {event_date}: {event['summary'][:100]}: {error}")
                time.sleep(0.5)
            print("Results:", counts)
        except Exception as error:
            if year not in failed:
                failed.append(year)
            print(f"FAILED {year}: {error}")
        finally:
            time.sleep(0.5)
    print("Failed years (rerun these ranges):", failed)
    return failed


def cli():
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_subparsers(dest="mode", required=True)
    daily = modes.add_parser("daily", help="Backfill archived daily current-events pages.")
    daily.add_argument("--start-date", type=date.fromisoformat, default=date(929, 1, 1)) 
    daily.add_argument("--end-date", type=date.fromisoformat, default=date(2005, 1, 7))
    yearly = modes.add_parser("year", help="Backfill dated entries from year-page Events sections.")
    yearly.add_argument("--start-year", type=int, default=900) #gemini usage limit hit here
    yearly.add_argument("--end-year", type=int)
    for mode in (daily, yearly):
        mode.add_argument("--dry-run", action="store_true", help="Preview both rows without database writes (still calls Wikipedia/Gemini).")
    args = parser.parse_args()
    try:
        if args.mode == "daily":
            failed = backfill(args.start_date, args.end_date, dry_run=args.dry_run)
        else:
            end_year = args.start_year if args.end_year is None else args.end_year
            failed = backfill_years(args.start_year, end_year, dry_run=args.dry_run)
    except ValueError as error:
        parser.error(str(error))
    return 1 if failed else 0


if __name__ == "__main__":
    configure_output()
    raise SystemExit(cli())
