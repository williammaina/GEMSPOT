"""Map backend category names ↔ frontend slugs (nature / eats / nightlife / action)."""

# Display name from seed → frontend slug
NAME_TO_SLUG = {
    "nature & outdoors": "nature",
    "nature": "nature",
    "cafes & workspaces": "eats",
    "cafe": "eats",
    "cafes": "eats",
    "eats": "eats",
    "nightlife & vibes": "nightlife",
    "nightlife": "nightlife",
    "action & adventure": "action",
    "adventure": "action",
    "action": "action",
}

# Frontend / API query slug → substrings to match Category.name
SLUG_MATCHERS = {
    "nature": ["nature", "outdoor"],
    "eats": ["cafe", "workspace", "eats", "food"],
    "cafe": ["cafe", "workspace", "eats"],
    "nightlife": ["nightlife", "vibe"],
    "action": ["action", "adventure"],
    "adventure": ["action", "adventure"],
}


def category_slug(category) -> str:
    if category is None:
        return "other"
    name = getattr(category, "name", None) or str(category)
    return NAME_TO_SLUG.get(str(name).strip().lower(), str(name).strip().lower().split()[0])


def filter_category_ids(Category, slug: str):
    """Return list of category_ids matching a frontend slug, or empty if unknown."""
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
