import re
from math import radians, sin, cos, sqrt, atan2
import time
from wikipedia import wiki_get


LOCATION_TYPES = {
    "city",
    "country",
    "adm1st",
    "adm2nd",
    "adm3rd",
    "landmark",
    "airport",
    "mountain",
    "isle",
    "waterbody",
}


def resolve_locations(titles):
    if not titles:
        return {}

    params = {
        "action": "query",
        "prop": "coordinates|pageprops",
        "titles": "|".join(titles),
        "coprimary": "primary",
        "coprop": "type|name|dim|country|region",
        "ppprop": "wikibase_item",
        "redirects": 1,
        "format": "json",
        "formatversion": 2,
    }

    response = wiki_get(params)

    time.sleep(0.15)

    data = response.json()

    results = {}

    for page in data.get("query", {}).get("pages", []):
        coordinates = page.get("coordinates")

        if not coordinates:
            continue

        coord = coordinates[0]

        results[page["title"]] = {
            "page": page["title"],
            "lat": coord["lat"],
            "lon": coord["lon"],
            "type": coord.get("type"),
            "dim": coord.get("dim"),
            "country": coord.get("country"),
            "region": coord.get("region"),
            "wikidata_id": page
                .get("pageprops", {})
                .get("wikibase_item"),
        }

    return results


def find_city_candidates(links, resolved):
    candidates = []

    for link in links:
        location = resolved.get(link["title"])

        if not location:
            continue

        # Approximate size of the geographic feature, in meters.
        dim = location.get("dim")

        try:
            dim = float(dim) if dim is not None else None
        except (TypeError, ValueError):
            dim = None

        geo_type = location.get("type")

        # Broad places are not precise enough for the game.
        if geo_type in {
            "country",
            "adm1st",
        }:
            continue

        # If Wikipedia gives us a dimension, require the
        # location to be reasonably precise.
        #
        # 100,000 meters = 100 km
        if dim is not None and dim > 100_000:
            continue

        candidates.append({
            **location,
            "display_name": link["text"],
            "dim": dim,
        })

    return candidates


def distance_km(a, b):
    radius = 6371.0088

    lat1 = radians(a["lat"])
    lon1 = radians(a["lon"])
    lat2 = radians(b["lat"])
    lon2 = radians(b["lon"])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    x = (
        sin(dlat / 2) ** 2
        + cos(lat1)
        * cos(lat2)
        * sin(dlon / 2) ** 2
    )

    return 2 * radius * atan2(
        sqrt(x),
        sqrt(1 - x)
    )


def choose_city(cities):
    if not cities:
        return None

    # Prefer the most precise location.
    # Smaller dimension = more specific geographic feature.
    cities = sorted(
        cities,
        key=lambda x: (
            x["dim"] is None,
            x["dim"] if x["dim"] is not None else float("inf")
        )
    )

    primary = cities[0]

    # If another candidate is very far away,
    # the story may involve multiple distinct locations.
    for other in cities[1:]:
        if distance_km(primary, other) > 75:
            return None

    return primary


def location_terms(links, resolved):
    terms = set()

    for link in links:
        info = resolved.get(link["title"])

        if not info:
            continue

        # If GeoData resolved this Wikipedia page to coordinates,
        # treat it as geographic information even if Wikipedia
        # didn't assign it a specific geographic type.
        if link["text"]:
            terms.add(link["text"])

        if info.get("page"):
            terms.add(info["page"])

    return sorted(
        terms,
        key=len,
        reverse=True
    )


def redact_locations(text, terms):
    result = text

    for term in terms:
        if len(term) < 2:
            continue

        result = re.sub(
            re.escape(term),
            "[REDACTED]",
            result,
            flags=re.IGNORECASE
        )

    return result