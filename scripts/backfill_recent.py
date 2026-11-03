from datetime import date, timedelta
import time
from config import configure_output

from main import process_day


def two_years_ago(day):
    try:
        return day.replace(year=day.year - 2)
    except ValueError:
        return day.replace(
            year=day.year - 2,
            day=28
        )


def backfill(start_date, end_date):
    current = start_date

    total_days = (end_date - start_date).days + 1
    completed = 0

    while current <= end_date:
        completed += 1

        print("\n")
        print("=" * 70)
        print(
            f"DAY {completed}/{total_days}: "
            f"{current}"
        )
        print("=" * 70)

        try:
            process_day(current)

        except Exception as error:
            print(
                f"FAILED {current}: {error}"
            )

        # Avoid hitting usage rates for wiki and gemeni.
        time.sleep(0.5)

        current += timedelta(days=1)


if __name__ == "__main__":
    configure_output()
    backfill(
        date(2026, 9, 14),
        date.today()
    )
