"""Map backend category names ↔ frontend slugs (nature / eats / nightlife / action)."""

NAME_TO_SLUG = {
    "nature & outdoors": "nature",
    "nature": "nature",
    "cafes & workspaces": "eats",
    "cafe": "eats",
    "cafes": "eats",
    "eats": "eats",
    "food & drink": "eats",
    "nightlife & vibes": "nightlife",
    "nightlife": "nightlife",
    "action & adventure": "action",
    "adventure": "action",
    "action": "action",
}

SLUG_MATCHERS = {
    "nature": ["nature", "outdoor"],
    "eats": ["cafe", "workspace", "eats", "food"],
    "cafe": ["cafe", "workspace", "eats"],
    "nightlife": ["nightlife", "vibe"],
    "action": ["action", "adventure"],
    "adventure": ["action", "adventure"],
}

# Frontend category slug → preferred seed name
SLUG_TO_NAME = {
    "nature": "Nature & Outdoors",
    "eats": "Cafes & Workspaces",
    "nightlife": "Nightlife & Vibes",
    "action": "Action & Adventure",
}


def category_slug(category) -> str:
    if category is None:
        return "other"
    name = getattr(category, "name", None) or str(category)
    return NAME_TO_SLUG.get(str(name).strip().lower(), str(name).strip().lower().split()[0])


def filter_category_ids(Category, slug: str):
    """Return list of category_ids matching a frontend slug, or None if no filter."""
    if not slug or slug in ("all", "*"):
        return None
    key = slug.strip().lower()
    matchers = SLUG_MATCHERS.get(key, [key])
    cats = Category.query.all()
    ids = []
    for c in cats:
        n = (c.name or "").lower()
        if any(m in n for m in matchers):
            ids.append(c.category_id)
    return ids


def resolve_category_id(Category, data: dict):
    """
    Resolve category_id from payload that may send:
      - category_id (int)
      - category (slug or name string)
    """
    if data.get("category_id"):
        try:
            return int(data["category_id"])
        except (TypeError, ValueError):
            pass

    raw = data.get("category") or data.get("category_slug")
    if not raw:
        return None

    raw_s = str(raw).strip()
    # numeric string
    if raw_s.isdigit():
        return int(raw_s)

    slug = raw_s.lower()
    # try slug matchers
    ids = filter_category_ids(Category, slug)
    if ids:
        return ids[0]

    # exact name match
    cat = Category.query.filter(Category.name.ilike(raw_s)).first()
    if cat:
        return cat.category_id

    # preferred seed name for known slug
    preferred = SLUG_TO_NAME.get(slug)
    if preferred:
        cat = Category.query.filter(Category.name.ilike(preferred)).first()
        if cat:
            return cat.category_id

    return None
