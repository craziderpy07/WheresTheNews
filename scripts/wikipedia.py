import requests
import re
from bs4 import BeautifulSoup
from urllib.parse import unquote

WIKI_API = "https://en.wikipedia.org/w/api.php"

session = requests.Session()

session.headers.update({
    "User-Agent": "WheresTheNews/0.1 (your-email@example.com)"
})


def get_current_events_page(day):
    page = f"Portal:Current events/{day.year} {day.strftime('%B')} {day.day}"

    params = {
        "action": "parse",
        "page": page,
        "prop": "text",
        "format": "json",
        "formatversion": 2,
        "disableeditsection": 1,
    }

    response = session.get(
        WIKI_API,
        params=params,
        timeout=30
    )

    response.raise_for_status()

    data = response.json()

    if "error" in data:
        return None, page

    return data["parse"]["text"], page


def clean_text(text):
    return re.sub(r"\s+", " ", text).strip()


def get_external_urls(li):
    urls = []

    for a in li.find_all("a", href=True):
        href = a["href"]

        if href.startswith(("https://", "http://")):
            urls.append(href)

        elif href.startswith("//"):
            urls.append("https:" + href)

    return list(dict.fromkeys(urls))


def remove_source_links(li):
    clone = BeautifulSoup(str(li), "html.parser")
    root = clone.find("li")

    for a in root.find_all("a", href=True):
        href = a["href"]

        if href.startswith(("http://", "https://", "//")):
            a.decompose()

    return clean_text(root.get_text(" ", strip=True))


def extract_events(html):
    soup = BeautifulSoup(html, "html.parser")

    events = []

    for li in soup.find_all("li"):

        if li.find("li"):
            continue

        summary = remove_source_links(li)

        if len(summary) < 40:
            continue

        context = get_event_context(li)

        events.append({
            "headline": context["headline"],
            "category": context["category"],
            "summary": summary,
            "source_urls": get_external_urls(li),
            "html_node": li,
        })
    return events


def wikipedia_title(anchor):
    href = anchor.get("href", "")

    if href.startswith(("http://", "https://", "//", "#")):
        return None

    title = anchor.get("title")

    if title and ":" not in title:
        return title

    if href.startswith("/wiki/"):
        title = unquote(href[len("/wiki/"):])
        title = title.split("#")[0].replace("_", " ")

        if ":" not in title:
            return title

    if href.startswith("./"):
        title = unquote(href[2:])
        title = title.split("#")[0].replace("_", " ")

        if ":" not in title:
            return title

    return None


def get_wikipedia_links(li):
    result = []

    for a in li.find_all("a"):
        title = wikipedia_title(a)

        if not title:
            continue

        result.append({
            "title": title,
            "text": clean_text(a.get_text(" ", strip=True))
        })

    return result

def text_without_nested_lists(tag):
    """
    Gets only the label/text belonging to this list item,
    without including all of its child event descriptions.
    """

    if tag is None:
        return None

    clone = BeautifulSoup(str(tag), "html.parser")
    root = clone.find(tag.name)

    # Remove nested lists
    for nested in root.find_all(["ul", "ol"], recursive=False):
        nested.decompose()

    # Remove citation numbers
    for sup in root.find_all("sup"):
        sup.decompose()

    text = clean_text(
        root.get_text(" ", strip=True)
    )

    return text or None


def get_event_context(li):
    # -------------------------
    # CATEGORY
    # -------------------------
    category = None

    previous_p = li.find_previous("p")

    if previous_p:
        bold = previous_p.find("b")

        if bold:
            category = clean_text(
                bold.get_text(" ", strip=True)
            )

    # -------------------------
    # HEADLINE / TOPIC
    # -------------------------
    parent_li = li.find_parent("li")

    headline = None

    if parent_li:
        headline = text_without_nested_lists(parent_li)

    return {
        "headline": headline,
        "category": category,
    }