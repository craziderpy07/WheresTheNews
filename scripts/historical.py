"""Conservative parser for dated events in Wikipedia's CE year pages."""

import re
from datetime import date

from bs4 import BeautifulSoup

from wikipedia import clean_text, get_external_urls, get_page, get_wikipedia_links


MONTHS = {name: number for number, name in enumerate((
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
), 1)}
MONTH_PATTERN = "(?:" + "|".join(MONTHS) + ")"
DATE_PREFIX = re.compile(
    rf"^(?P<month>{MONTH_PATTERN})\s+(?P<day>\d{{1,2}})\b(?P<rest>.*)$"
)
SEPARATOR = re.compile(r"^\s*[\u2013\u2014-]\s*(?P<body>.+)$")
RANGE_END = re.compile(
    rf"^(?:\d{{1,2}}(?:\s*[\u2013\u2014-]|\s*$)|{MONTH_PATTERN}\s+\d{{1,2}}\b)"
)
HEADINGS = [f"h{level}" for level in range(1, 7)]

# Year pages have event descriptions rather than a dedicated headline field.
# Prefer linked event articles, not the first link (often a date/person/place).
SPECIFIC_EVENT_TITLE = re.compile(
    r"\b(?:battles? (?:of|at|for)|siege of|treaty of|peace of|"
    r"election|referendum|rebellion|revolt|uprising|revolution|coup|"
    r"massacre|assassination|bombing|earthquake|eruption|flood|"
    r"great fire|conference|congress of|expedition|coronation|"
    r"declaration of|proclamation of|convention of|"
    r"world.?s fair|exposition)\b", re.IGNORECASE,
)
GENERAL_EVENT_TITLE = re.compile(r"\b(?:war|crusade)\b", re.IGNORECASE)
GENERIC_TOPICS = {
    "battle", "siege", "treaty", "civil war", "war", "election",
    "general election", "presidential election", "referendum", "rebellion",
    "revolt", "uprising", "revolution", "coup d'\u00e9tat", "massacre",
    "assassination", "bombing", "earthquake", "volcanic eruption", "flood",
    "conference", "congress", "expedition", "coronation", "crusade",
    "peace conference", "declaration of independence",
}


def extract_event_headline(node):
    """Reuse the article title of an identifiable event; otherwise allow AI fallback."""
    general = None
    for link in get_wikipedia_links(node):
        title = link["title"]
        if title.casefold() in GENERIC_TOPICS:
            continue
        if SPECIFIC_EVENT_TITLE.search(title):
            return title
        if general is None and GENERAL_EVENT_TITLE.search(title):
            general = title
    return general


def get_year_page(year):
    date(year, 1, 1)  # Reject BCE and years outside Python's supported range.
    return get_page(str(year))


def _own_node(li):
    """Exclude child events and citations, but keep event links for geolocation."""
    node = BeautifulSoup(str(li), "html.parser").find("li")
    for nested in node.find_all(["ul", "ol"], recursive=False):
        nested.decompose()
    for citation in node.select("sup, .reference, .mw-editsection"):
        citation.decompose()
    return node


def _date_and_summary(text, year):
    match = DATE_PREFIX.fullmatch(text)
    if not match:
        return None
    try:
        day = date(year, MONTHS[match["month"]], int(match["day"]))
    except ValueError:
        return None
    rest = match["rest"].strip()
    if rest in {"", ":", "-", "\u2013", "\u2014"}:
        return day, ""  # A date label may introduce several nested events.
    description = SEPARATOR.fullmatch(rest)
    if not description or RANGE_END.match(description["body"]):
        return None  # E.g. January 1-3, January 1 and 2, or an unknown format.
    return day, description["body"].strip()


def _source_urls(li, soup):
    """Collect direct source URLs and URLs in this entry's referenced footnotes."""
    clone = BeautifulSoup(str(li), "html.parser").find("li")
    for nested in clone.find_all(["ul", "ol"], recursive=False):
        nested.decompose()
    urls = get_external_urls(clone)
    for anchor in clone.select('a[href*="#cite_note"]'):
        target = soup.find(id=anchor["href"].split("#", 1)[1])
        if target is not None:
            urls.extend(get_external_urls(target))
    return list(dict.fromkeys(urls))


def extract_year_events(html, year):
    """Return (event_date, event) pairs; log and skip uncertain entries."""
    date(year, 1, 1)
    soup = BeautifulSoup(html, "html.parser")
    in_events = False
    section_level = None
    events = []
    for tag in soup.find_all(HEADINGS + ["li"]):
        if tag.name in HEADINGS:
            level = int(tag.name[1])
            title = clean_text(tag.get_text(" ", strip=True))
            if not in_events:
                marker = tag.find(id="Events")
                if tag.get("id") == "Events" or marker or title == "Events":
                    in_events = True
                    section_level = level
            elif level <= section_level:
                break
            continue
        if not in_events:
            continue
        # Container items are date labels, not individual events.
        if tag.find(["ul", "ol"]):
            continue
        node = _own_node(tag)
        text = clean_text(node.get_text(" ", strip=True))
        parsed = _date_and_summary(text, year)
        if parsed is None and not re.match(rf"^{MONTH_PATTERN}\b", text):
            # Only inherit an exact date label, never a parent's event prose.
            parent = tag.find_parent("li")
            if parent:
                label = clean_text(_own_node(parent).get_text(" ", strip=True))
                parent_date = _date_and_summary(label, year)
                if parent_date and not parent_date[1]:
                    parsed = (parent_date[0], text)
        if parsed is None or not parsed[1]:
            print(f"SKIPPED {year}: uncertain/invalid date or structure: {text[:120]}")
            continue
        event_date, summary = parsed
        events.append((event_date, {
            "summary": summary,
            "headline": extract_event_headline(node),
            "category": "Historical event",
            "source_urls": _source_urls(tag, soup),
            "html_node": node,
        }))
    if not in_events:
        print(f"SKIPPED {year}: no Events section found.")
    return events
