"""
GemSpot KE — schema-safe seeder
================================
Fixes: sqlite3.OperationalError: no such column: places.matatu_route

What this does differently from older seeds:
  1. Drops ALL tables and recreates them from the current SQLAlchemy models
     (so columns like matatu_route always exist).
  2. Optionally upgrades an existing SQLite DB in-place if you set
     DROP_AND_RECREATE = False.
  3. Seeds 100 places × 4 categories + 100 events × 4 categories.

Run (from project root, venv active):
    python seed.py
    # or
    flask seed

Delete old Alembic / flask-migrate revisions if you are resetting:
    rm -rf migrations/versions/*
    # then after this seed works once:
    flask db stamp head   # optional, only if you still use migrate
"""

from __future__ import annotations

import random
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

from extensions import db
from models.user import User
from models.category import Category, Tag
from models.place import Place, PlaceImage
from models.event import Event
from models.vibe_check import VibeCheck

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
RECORDS_PER_CATEGORY = 100
EVENTS_PER_CATEGORY = 100
RANDOM_SEED = 42

# True  → drop every table, recreate from models, then seed (RECOMMENDED)
# False → try ALTER TABLE for missing columns, keep existing rows, then clear + seed
DROP_AND_RECREATE = False  # use Flask-Migrate for schema; seed only inserts data

# ---------------------------------------------------------------------------
# Geography (verified Kenya centroids + matatu hints)
# ---------------------------------------------------------------------------
KENYA_LOCS = {
    "nature": [
        ("Tigoni", "Kiambu", -1.1280, 36.6980, "Tigoni Tea Country", "Matatu to Limuru/Tigoni via Banana Hill or Limuru Rd"),
        ("Limuru", "Kiambu", -1.1136, 36.6428, "Limuru Highlands", "Limuru stage from Nairobi; alight Limuru town"),
        ("Karura", "Nairobi", -1.2443, 36.8288, "Karura Forest — Limuru Rd Gate", "106 / 11B from Odeon toward Limuru Rd"),
        ("Karura", "Nairobi", -1.2390, 36.8120, "Karura Forest — Kiambu Rd Gate", "Matatu toward Kiambu Rd / Ridgeways"),
        ("Ngong Hills", "Kajiado", -1.4010, 36.6360, "Ngong Hills Trailhead", "Ngong matatu from Railways; boda to trailhead"),
        ("Karen", "Nairobi", -1.3197, 36.7120, "Oloolua Nature Trail", "Karen matatu / Uber to Oloolua"),
        ("Hell's Gate", "Nakuru", -0.9150, 36.3100, "Hell's Gate National Park", "Nairobi–Naivasha shuttle then park taxi"),
        ("Naivasha", "Nakuru", -0.7667, 36.3500, "Lake Naivasha shoreline", "Easy Coach / shuttle to Naivasha town"),
        ("Longonot", "Nakuru", -0.9140, 36.4560, "Mount Longonot", "Naivasha then boda/taxi to park gate"),
        ("Aberdare", "Nyeri", -0.4167, 36.7000, "Aberdare Range edge", "Nyeri-bound bus; arrange park transfer"),
        ("Diani", "Kwale", -4.2800, 39.5800, "Diani coastal forest", "SGR/bus to Ukunda then tuk-tuk"),
        ("Watamu", "Kilifi", -3.3530, 40.0180, "Watamu marine edge", "Malindi/Watamu bus from Mombasa"),
        ("Fourteen Falls", "Kiambu", -1.0500, 37.1000, "Fourteen Falls, Thika", "Thika Rd matatu; alight toward falls junction"),
        ("Kakamega", "Kakamega", 0.2833, 34.8500, "Kakamega Forest", "Kisumu–Kakamega bus"),
        ("Shimba Hills", "Kwale", -4.2500, 39.4000, "Shimba Hills", "From Ukunda / Kwale town"),
        ("Ol Pejeta", "Laikipia", 0.0200, 36.9000, "Ol Pejeta edge, Nanyuki", "Nairobi–Nanyuki bus; conservancy transfer"),
        ("Menengai", "Nakuru", -0.2500, 36.0700, "Menengai Crater", "Nakuru town then local taxi"),
        ("Chyulu", "Makueni", -2.6000, 37.8000, "Chyulu Hills", "Emali/Mtito Andei access"),
        ("Samburu", "Samburu", 0.6500, 37.5300, "Samburu conservancy edge", "Isiolo–Samburu transfer"),
        ("Tsavo", "Taita-Taveta", -3.0000, 38.5000, "Tsavo East gate area", "Mombasa Rd; park gate taxi"),
    ],
    "cafe": [
        ("Westlands", "Nairobi", -1.2673, 36.8110, "Westlands", "Any Westlands matatu; alight near Mpaka/Waiyaki"),
        ("Kilimani", "Nairobi", -1.2880, 36.7850, "Kilimani", "Ngong Rd / Argwings Kodhek matatus"),
        ("Lavington", "Nairobi", -1.2780, 36.7680, "Lavington", "James Gichuru / Lavington Green access"),
        ("Karen", "Nairobi", -1.3197, 36.7120, "Karen", "Karen matatu from CBD or Ngong Rd"),
        ("CBD", "Nairobi", -1.2864, 36.8172, "Nairobi CBD", "Any CBD stage; walk last blocks"),
        ("Gigiri", "Nairobi", -1.2360, 36.7989, "Gigiri / UN area", "Limuru Rd toward Gigiri / Village Market"),
        ("Ruiru", "Kiambu", -1.1500, 36.9600, "Ruiru", "Thika Superhighway matatu to Ruiru"),
        ("Nyali", "Mombasa", -4.0200, 39.7000, "Nyali", "Nyali bridge then local tuktuk"),
        ("Mombasa", "Mombasa", -4.0435, 39.6682, "Mombasa CBD", "Town stage; short walk"),
        ("Kisumu", "Kisumu", -0.1000, 34.7500, "Kisumu Milimani", "Kisumu town matatu to Milimani"),
        ("Nakuru", "Nakuru", -0.3031, 36.0800, "Nakuru town", "Central Nakuru stages"),
        ("Eldoret", "Uasin Gishu", 0.5143, 35.2698, "Eldoret", "Town centre stages"),
        ("Tigoni", "Kiambu", -1.1200, 36.7000, "Tigoni", "Limuru Rd / Banana toward Tigoni"),
        ("Limuru", "Kiambu", -1.1136, 36.6428, "Limuru town", "Limuru stage from Nairobi"),
        ("Rongai", "Kajiado", -1.3960, 36.7550, "Ongata Rongai", "Rongai matatu from CBD"),
        ("Kitengela", "Kajiado", -1.4700, 36.9600, "Kitengela", "Kitengela matatu via Mombasa Rd"),
        ("South C", "Nairobi", -1.3220, 36.8350, "South C", "South C / Belle Vue routes"),
        ("Parklands", "Nairobi", -1.2600, 36.8200, "Parklands", "Parklands / Highridge matatus"),
        ("Hurlingham", "Nairobi", -1.2950, 36.7900, "Hurlingham", "Argwings Kodhek corridor"),
        ("Upper Hill", "Nairobi", -1.3000, 36.8150, "Upper Hill", "Upper Hill / Community area access"),
    ],
    "nightlife": [
        ("Westlands", "Nairobi", -1.2673, 36.8110, "Westlands", "Uber recommended after 10pm; Mpaka Rd corridor"),
        ("Kilimani", "Nairobi", -1.2880, 36.7850, "Kilimani", "Ride-hail preferred at night"),
        ("CBD", "Nairobi", -1.2864, 36.8172, "Nairobi CBD", "Use trusted rides after dark"),
        ("Karen", "Nairobi", -1.3197, 36.7120, "Karen", "Uber/Bolt from Karen hub"),
        ("Nyali", "Mombasa", -4.0200, 39.7000, "Nyali", "Nyali nightlife strip; tuktuk/Uber"),
        ("Bamburi", "Mombasa", -3.9800, 39.7200, "Bamburi", "Mombasa–Malindi Rd"),
        ("Kisumu", "Kisumu", -0.0917, 34.7680, "Kisumu lakefront", "Town centre then short hop"),
        ("Nakuru", "Nakuru", -0.3031, 36.0800, "Nakuru", "Central Nakuru"),
        ("Lavington", "Nairobi", -1.2780, 36.7680, "Lavington", "Ride-hail along James Gichuru"),
        ("Riverside", "Nairobi", -1.2700, 36.8000, "Riverside", "Riverside Dr; Uber recommended"),
        ("Ngong Road", "Nairobi", -1.3000, 36.7800, "Ngong Road", "Ngong Rd corridor"),
        ("Diani", "Kwale", -4.2800, 39.5800, "Diani", "Beach road tuk-tuks"),
        ("Malindi", "Kilifi", -3.2190, 40.1169, "Malindi", "Malindi town centre"),
        ("Eldoret", "Uasin Gishu", 0.5143, 35.2698, "Eldoret", "Town nightlife cluster"),
        ("Thika", "Kiambu", -1.0333, 37.0693, "Thika", "Thika town stages"),
        ("Parklands", "Nairobi", -1.2600, 36.8200, "Parklands", "Parklands evening strip"),
        ("South B", "Nairobi", -1.3100, 36.8400, "South B", "Short Uber from CBD"),
        ("Embakasi", "Nairobi", -1.3200, 36.8900, "Embakasi", "Eastern bypass access"),
        ("Machakos", "Machakos", -1.5177, 37.2634, "Machakos", "Machakos town"),
        ("Kitale", "Trans-Nzoia", 1.0157, 35.0062, "Kitale", "Town centre"),
    ],
    "adventure": [
        ("Ruaka", "Nairobi", -1.2035, 36.7836, "Two Rivers Mall, Limuru Rd", "Limuru Rd / Northern Bypass; matatu to Ruaka or Two Rivers"),
        ("Mombasa Road", "Nairobi", -1.3190, 36.8500, "Panari / Mombasa Rd", "Mombasa Rd matatus; alight Panari area"),
        ("Karen", "Nairobi", -1.3197, 36.7120, "Karen adventure cluster", "Karen access via Ngong Rd"),
        ("Naivasha", "Nakuru", -0.7667, 36.3500, "Naivasha activities", "Shuttle to Naivasha then local transfer"),
        ("Hell's Gate", "Nakuru", -0.9150, 36.3100, "Hell's Gate cycling/hikes", "Park entry near Naivasha"),
        ("Diani", "Kwale", -4.2800, 39.5800, "Diani water sports", "Ukunda airstrip / beach road"),
        ("Watamu", "Kilifi", -3.3530, 40.0180, "Watamu snorkel decks", "Watamu village access"),
        ("Nanyuki", "Laikipia", 0.0167, 37.0667, "Nanyuki outdoor base", "Nairobi–Nanyuki highway"),
        ("Elementaita", "Nakuru", -0.4500, 36.2500, "Elementaita", "Nakuru–Nairobi highway stops"),
        ("Longonot", "Nakuru", -0.9140, 36.4560, "Longonot hike base", "Near Longonot town / park gate"),
        ("Kitengela", "Kajiado", -1.4700, 36.9600, "Kitengela", "Kitengela matatu"),
        ("Ngong", "Kajiado", -1.3610, 36.6560, "Ngong", "Ngong town stage"),
        ("Kisumu", "Kisumu", -0.0917, 34.7680, "Kisumu lakeside", "Kisumu town"),
        ("Malindi", "Kilifi", -3.2190, 40.1169, "Malindi", "Malindi town"),
        ("Athi River", "Machakos", -1.4500, 36.9800, "Athi River", "Mombasa Rd toward Athi River"),
        ("Ruiru", "Kiambu", -1.1500, 36.9600, "Ruiru", "Thika Superhighway"),
        ("Syokimau", "Machakos", -1.3600, 36.9300, "Syokimau", "SGR / Mombasa Rd corridor"),
        ("Gigiri", "Nairobi", -1.2360, 36.7989, "Gigiri", "Limuru Rd"),
        ("Westlands", "Nairobi", -1.2673, 36.8110, "Westlands", "Westlands hubs"),
        ("Kilimani", "Nairobi", -1.2880, 36.7850, "Kilimani", "Kilimani indoor venues"),
    ],
}

PLACE_TEMPLATES = {
    "nature": [
        "Tigoni Tea Estate Walk", "Limuru Tea Ridge Viewpoint", "Karura Forest Trail",
        "Ngong Hills Summit Path", "Hell's Gate Gorge Walk", "Lake Naivasha Crescent",
        "Longonot Crater Rim", "Aberdare Picnic Edge", "Diani Coastal Path",
        "Watamu Boardwalk", "Fourteen Falls Day Spot", "Oloolua Nature Loop",
        "Kakamega Canopy Walk", "Shimba Hills Lookout", "Menengai Crater Edge",
        "Ol Pejeta Edge Walk", "Chyulu Green Trail", "Karura Waterfall Circuit",
        "Limuru Highlands Path", "Tigoni Garden Walk",
    ],
    "cafe": [
        "Java House", "Artcaffe", "Connect Coffee Lab", "CJ's Kitchen",
        "Nyama Choma Yard", "Bean Bag Café", "Urban Coffee Works", "Soko Bistro",
        "Coastal Plate", "Green Bowl", "Notebook & Latte", "Power Socket Studio",
        "Tigoni Tea House", "Nyali Coffee Yard", "Kisumu Lakeside Café",
        "Nakuru Town Bites", "Upper Hill Café", "Riverside Roast", "Mama Oliech Kitchen",
        "Limuru Highlands Café",
    ],
    "nightlife": [
        "The Alchemist Live Room", "Moonlight Lounge", "Bassline Club", "Rooftop Social",
        "Jazz & Gin Bar", "Neon Yard", "After Hours", "Vinyl Listening Room",
        "Skyline Sessions", "Pulse Lounge", "Coastal Beats Club", "Waterfront Night",
        "Social House", "Beach Club", "Sunset Bar", "Cocktail Lab", "Live Stage",
        "Night Market Bar", "After Dark Lounge", "Sapphire Club",
    ],
    "adventure": [
        "Mad Max Karting Two Rivers", "Panari Ice Rink Area", "Climb Zone Wall",
        "Bowling Arena", "Trampoline Park", "Paintball Base", "Hell's Gate Bike Hire",
        "Naivasha Boat Deck", "Diani Kite School", "Watamu Snorkel Deck",
        "Longonot Hike Base", "Nanyuki Trek Yard", "Escape Room Lab", "Archery Range",
        "Skate Circuit", "Zipline Deck", "Indoor Soccer Cage", "BMX Track",
        "Family Play Arena", "Adventure Desk",
    ],
}

PRICE_LEVELS = ["Budget", "Moderate", "Premium", "Luxury"]
PRICE_RANGES = {
    "Budget": (200, 1500),
    "Moderate": (1500, 3500),
    "Premium": (3500, 7000),
    "Luxury": (7000, 20000),
}
DRESS = ["Casual", "Smart Casual", "Sporty / Casual", "Relaxed", "No dress code"]

EVENT_TITLES = {
    "nature": [
        "Tigoni Tea Sunrise Walk", "Karura Community Run", "Ngong Hills Ridge Hike",
        "Hell's Gate Cycling Day", "Naivasha Birding Morning", "Fourteen Falls Photo Walk",
        "Limuru Highlands Picnic", "Diani Coastal Walk", "Watamu Marine Day", "Oloolua Family Nature Day",
    ],
    "cafe": [
        "Founders Coffee Meetup", "Latte Art Workshop", "Book Club Brunch",
        "Remote Workers Friday", "Nyama Choma Social", "Tigoni Tea Tasting",
        "Startup Pitch & Coffee", "Weekend Brunch Market", "Food Bloggers Walk", "Chef Pop-up Table",
    ],
    "nightlife": [
        "Afrobeats Live Night", "Jazz & Cocktails", "Rooftop Sunset DJ", "Vinyl Listening Party",
        "Salsa Night", "Coastal Beats Friday", "Indie Band Showcase", "Comedy & Cocktails",
        "Ladies Night Social", "Weekend Warm-up Party",
    ],
    "adventure": [
        "Mad Max Kart Cup", "Indoor Climb Night", "Family Trampoline Day", "Paintball Tournament",
        "Ice Skating Intro", "Naivasha Boat Challenge", "Diani Kitesurf Starter",
        "Escape Room Championship", "Archery Open Day", "Longonot Sunrise Hike",
    ],
}

VIBE_NOTES = [
    "Calm midweek — easy parking.",
    "Busy on Saturdays; arrive early.",
    "Strong for dates.",
    "Family-friendly before evening.",
    "Budget matched the listing for two.",
    "M-Pesa till worked smoothly.",
    "Worth the matatu hop.",
    "Felt secure leaving after dark.",
]


# ---------------------------------------------------------------------------
# Schema helpers — this is what fixes "no such column: places.matatu_route"
# ---------------------------------------------------------------------------

# Columns the Place model expects (from the failing SELECT in your logs)
PLACE_COLUMNS = {
    "matatu_route": "TEXT",
    "price_level": "TEXT",
    "damage_for_two": "REAL",
    "gate_fee": "TEXT",
    "mpesa_available": "BOOLEAN",
    "till_number": "TEXT",
    "parking": "BOOLEAN",
    "wifi": "BOOLEAN",
    "power_sockets": "BOOLEAN",
    "pet_friendly": "BOOLEAN",
    "is_indoor": "BOOLEAN",
    "dress_code": "TEXT",
    "reservation_required": "BOOLEAN",
    "opening_hours": "TEXT",
    "featured_image": "TEXT",
    "verified": "BOOLEAN",
    "created_at": "DATETIME",
    "category_id": "INTEGER",
    "name": "TEXT",
    "description": "TEXT",
    "latitude": "REAL",
    "longitude": "REAL",
    "county": "TEXT",
    "town": "TEXT",
    "address": "TEXT",
}


def _sqlite_path_from_uri(uri: str) -> Path | None:
    """Resolve sqlite file path from SQLALCHEMY_DATABASE_URI."""
    if not uri:
        return None
    raw = uri.replace("sqlite:///", "").replace("sqlite://", "")
    if raw in (":memory:", ""):
        return None
    path = Path(raw)
    if not path.is_absolute():
        path = Path.cwd() / path
    return path


def ensure_schema():
    """
    Bring the database in line with current models.

    DROP_AND_RECREATE=True (default):
        db.drop_all() + db.create_all()  → clean slate matching models.

    DROP_AND_RECREATE=False:
        For SQLite only, ALTER TABLE ADD COLUMN for any missing place columns.
    """
    engine = db.engine
    dialect = engine.dialect.name

    if DROP_AND_RECREATE:
        print("🗑  Dropping all tables…")
        db.drop_all()
        print("🏗  Creating tables from current models…")
        db.create_all()
        print("   ✓ Schema matches SQLAlchemy models (includes matatu_route, etc.)")
        return

    # Migrate path: tables should already exist from `flask db upgrade`.
    # Still create_all() is a no-op for existing tables; then patch any missing cols.
    print("📐 Using existing schema (Flask-Migrate). Checking places columns…")
    db.create_all()  # safe no-op if migrate already created tables

    # Soft path: only patch SQLite places table
    if dialect != "sqlite":
        print("⚠  Non-SQLite DB and DROP_AND_RECREATE=False — running create_all only.")
        db.create_all()
        return

    uri = str(engine.url)
    db_path = _sqlite_path_from_uri(uri)
    if db_path is None or not db_path.exists():
        print("🏗  No existing SQLite file — create_all()")
        db.create_all()
        return

    print(f"🔧 Patching SQLite schema: {db_path}")
    conn = sqlite3.connect(str(db_path))
    cur = conn.cursor()

    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='places'")
    if not cur.fetchone():
        conn.close()
        db.create_all()
        print("   ✓ places table created via create_all()")
        return

    cur.execute("PRAGMA table_info(places)")
    existing = {row[1] for row in cur.fetchall()}
    added = []
    for col, typ in PLACE_COLUMNS.items():
        if col not in existing:
            try:
                cur.execute(f"ALTER TABLE places ADD COLUMN {col} {typ}")
                added.append(col)
            except sqlite3.OperationalError as exc:
                print(f"   ⚠ could not add {col}: {exc}")

    conn.commit()
    conn.close()

    # Ensure any other model tables exist
    db.create_all()

    if added:
        print(f"   ✓ Added columns: {', '.join(added)}")
    else:
        print("   ✓ places columns already present")


def _clear_all():
    """Delete seed data without dropping tables."""
    for table_name in ("place_tags", "place_tag", "places_tags", "event_tags"):
        try:
            db.session.execute(db.text(f"DELETE FROM {table_name}"))
        except Exception:
            pass
    try:
        VibeCheck.query.delete()
    except Exception:
        pass
    try:
        Event.query.delete()
    except Exception:
        pass
    try:
        PlaceImage.query.delete()
    except Exception:
        pass
    try:
        Place.query.delete()
    except Exception:
        pass
    try:
        Tag.query.delete()
    except Exception:
        pass
    try:
        Category.query.delete()
    except Exception:
        pass
    try:
        User.query.delete()
    except Exception:
        pass
    db.session.commit()


# ---------------------------------------------------------------------------
# Seed helpers
# ---------------------------------------------------------------------------

def _img(category: str, index: int) -> str:
    return f"https://picsum.photos/seed/gemspot-{category}-{index:03d}/1200/800"


def _price(level: str) -> int:
    lo, hi = PRICE_RANGES[level]
    return random.randint(lo, hi)


def _hours(key: str) -> str:
    return {
        "nature": "06:00 AM - 06:00 PM",
        "cafe": "06:30 AM - 09:30 PM",
        "nightlife": "04:00 PM - 04:00 AM",
        "adventure": "09:00 AM - 09:00 PM",
    }[key]


def _place_kwargs(category, key: str, index: int) -> dict:
    town, county, base_lat, base_lng, area, matatu = random.choice(KENYA_LOCS[key])
    template = PLACE_TEMPLATES[key][(index - 1) % len(PLACE_TEMPLATES[key])]

    if "Tea" in template or "Tigoni" in template:
        tea_locs = [
            x for x in KENYA_LOCS.get("nature", []) + KENYA_LOCS.get("cafe", [])
            if x[1] == "Kiambu" and (x[0] in ("Tigoni", "Limuru") or "Tigoni" in x[4] or "Limuru" in x[4])
        ]
        if not tea_locs:
            tea_locs = [x for x in KENYA_LOCS["nature"] if x[1] == "Kiambu"]
        town, county, base_lat, base_lng, area, matatu = random.choice(tea_locs)

    if key == "adventure" and "Two Rivers" in template:
        town, county, base_lat, base_lng, area, matatu = next(
            x for x in KENYA_LOCS["adventure"] if "Two Rivers" in x[4]
        )

    name = f"{template} — {area} #{index:03d}"
    price_level = random.choice(PRICE_LEVELS)
    damage = _price(price_level)
    image = _img(key, index)
    lat = round(base_lat + random.uniform(-0.008, 0.008), 6)
    lng = round(base_lng + random.uniform(-0.008, 0.008), 6)

    indoor = key in ("cafe", "nightlife") or (key == "adventure" and random.random() > 0.35)
    wifi = key == "cafe" or random.random() > 0.55
    sockets = key == "cafe" or random.random() > 0.7
    pets = key == "nature" or random.random() > 0.85
    parking = random.random() > 0.2
    mpesa = random.random() > 0.08

    if key == "nature":
        gate = random.choice([
            "None",
            "100 KES Citizen / 600 KES Non-Resident",
            "200 KES",
            "Adults 300 KES / Kids 100 KES",
            "Tea estate tour fee applies",
        ])
        desc = (
            f"{template} at {area}, {county} County. "
            f"Access: {matatu}. Practical entry, parking, and outdoor logistics."
        )
    elif key == "cafe":
        gate = "None"
        desc = (
            f"{template} in {area}, {county}. "
            f"Eatery/workspace with damage-for-two guidance. Getting there: {matatu}."
        )
    elif key == "nightlife":
        gate = random.choice(["None", "500 KES after 8pm", "1000 KES weekends", "Members free before 10pm"])
        desc = (
            f"{template} in {area}, {county}. "
            f"Nightlife logistics and dress expectations. Transport: {matatu}."
        )
    else:
        gate = random.choice(["None", "Session fee at counter", "200 KES entry + activity fee"])
        desc = (
            f"{template} around {area}, {county}. "
            f"Action & play session pricing. Directions: {matatu}."
        )

    return dict(
        category_id=category.category_id,
        name=name,
        description=desc,
        latitude=lat,
        longitude=lng,
        county=county,
        town=town,
        address=f"{area}, {county}, Kenya",
        matatu_route=matatu,
        price_level=price_level,
        damage_for_two=damage,
        gate_fee=gate,
        mpesa_available=mpesa,
        till_number=str(random.randint(100000, 999999)) if mpesa else None,
        parking=parking,
        wifi=wifi,
        power_sockets=sockets,
        pet_friendly=pets,
        is_indoor=indoor,
        dress_code=random.choice(DRESS),
        reservation_required=(key == "nightlife" and random.random() > 0.55)
        or (price_level == "Luxury" and random.random() > 0.5),
        opening_hours=_hours(key),
        featured_image=image,
        verified=random.random() > 0.15,
    )


def _attach_tags(places, pool, k=3):
    for place in places:
        k_eff = min(k, len(pool))
        chosen = random.sample(pool, k=k_eff)
        seen, unique = set(), []
        for tag in chosen:
            tid = getattr(tag, "tag_id", None) or getattr(tag, "id", None)
            if tid in seen:
                continue
            seen.add(tid)
            unique.append(tag)
        place.tags = unique
    db.session.commit()


def seed_data():
    if RANDOM_SEED is not None:
        random.seed(RANDOM_SEED)

    print("=" * 60)
    print("GemSpot KE seeder — schema-safe")
    print("=" * 60)

    # 1) Fix schema FIRST (this is the matatu_route fix)
    ensure_schema()

    # 2) Clear rows (needed when DROP_AND_RECREATE=False)
    if not DROP_AND_RECREATE:
        print("🌱 Clearing existing seed data…")
        _clear_all()
    else:
        print("🌱 Tables empty after recreate — seeding…")

    print("👥 Creating users…")
    admin = User(
        first_name="Admin", last_name="GemSpot", username="admin",
        email="admin@gemspot.co.ke", phone="+254700000000",
        bio="Official GemSpot KE Administrator", is_admin=True,
    )
    admin.set_password("AdminPass2026!")
    test_user = User(
        first_name="Wanjiku", last_name="Kamau", username="wanjiku_k",
        email="wanjiku@example.com", phone="+254711223344",
        bio="Coffee addict, Tigoni weekender & hiker.",
    )
    test_user.set_password("Password123!")
    extras = []
    for fn, ln in [("Brian", "Otieno"), ("Aisha", "Hassan"), ("Kevin", "Mwangi"), ("Faith", "Njeri"), ("Sam", "Kiptoo")]:
        u = User(
            first_name=fn, last_name=ln,
            username=f"{fn.lower()}_{ln.lower()[:1]}",
            email=f"{fn.lower()}.{ln.lower()}@example.com",
            phone=f"+25471{random.randint(1000000, 9999999)}",
            bio=f"{fn} explores Kenya with GemSpot.",
        )
        u.set_password("Password123!")
        extras.append(u)
    db.session.add_all([admin, test_user, *extras])
    db.session.commit()

    print("🏷️  Creating categories…")
    cat_nature = Category(name="Nature & Outdoors", icon="tree", description="Tea farms, parks, hikes across Kenya", theme_color="Emerald")
    cat_cafe = Category(name="Cafes & Workspaces", icon="coffee", description="Eateries and work-friendly spots", theme_color="Amber")
    cat_nightlife = Category(name="Nightlife & Vibes", icon="music", description="Clubs, lounges, live music", theme_color="Sapphire")
    cat_adventure = Category(name="Action & Adventure", icon="compass", description="Karting, climbing, water sports", theme_color="Ruby")
    db.session.add_all([cat_nature, cat_cafe, cat_nightlife, cat_adventure])
    db.session.commit()

    print("🏷️  Creating tags…")
    tag_names = [
        "Fast WiFi", "Scenic Views", "Great Cocktails", "Family Friendly", "Pet Friendly",
        "Secure Parking", "M-Pesa Friendly", "Date Night", "Live Music", "Outdoor Seating",
        "Power Sockets", "Budget Friendly", "Premium Experience", "Group Friendly",
        "Quiet Workspace", "Tea Farm", "Coastal", "Highland", "Water Sports", "Hiking",
    ]
    tags = [Tag(name=n) for n in tag_names]
    db.session.add_all(tags)
    db.session.commit()
    T = {t.name: t for t in tags}
    tags_for = {
        "nature": [T["Scenic Views"], T["Family Friendly"], T["Hiking"], T["Tea Farm"], T["Highland"], T["Budget Friendly"]],
        "cafe": [T["Fast WiFi"], T["Power Sockets"], T["Quiet Workspace"], T["M-Pesa Friendly"], T["Outdoor Seating"]],
        "nightlife": [T["Great Cocktails"], T["Live Music"], T["Date Night"], T["Secure Parking"], T["Premium Experience"]],
        "adventure": [T["Family Friendly"], T["Group Friendly"], T["Water Sports"], T["Secure Parking"], T["M-Pesa Friendly"]],
    }

    category_map = {
        "nature": cat_nature,
        "cafe": cat_cafe,
        "nightlife": cat_nightlife,
        "adventure": cat_adventure,
    }

    print(f"📍 Creating {RECORDS_PER_CATEGORY} places × 4…")
    all_places = []
    places_by_key = {}
    used_images = set()

    for key, category in category_map.items():
        batch = []
        for i in range(1, RECORDS_PER_CATEGORY + 1):
            kwargs = _place_kwargs(category, key, i)
            assert kwargs["featured_image"] not in used_images, "duplicate image"
            used_images.add(kwargs["featured_image"])
            if "Tea" in kwargs["name"] or "Tigoni" in kwargs["name"]:
                if kwargs["county"] != "Kiambu":
                    kwargs["county"] = "Kiambu"
                    kwargs["town"] = "Tigoni"
                    kwargs["address"] = "Tigoni Tea Country, Kiambu, Kenya"
                    kwargs["matatu_route"] = "Matatu to Limuru/Tigoni via Banana Hill or Limuru Rd"
                    kwargs["latitude"] = -1.1280 + random.uniform(-0.008, 0.008)
                    kwargs["longitude"] = 36.6980 + random.uniform(-0.008, 0.008)
            batch.append(Place(**kwargs))
        db.session.add_all(batch)
        db.session.commit()
        _attach_tags(batch, tags_for[key], k=3)
        print(f"   ✓ {category.name}: {RECORDS_PER_CATEGORY}")
        places_by_key[key] = batch
        all_places.extend(batch)

    print("🖼️  Place gallery images…")
    img_batch = []
    for place in all_places:
        for g in range(1, 3):
            url = f"https://picsum.photos/seed/gemspot-gal-{place.place_id}-{g}/1200/800"
            kwargs = {"place_id": place.place_id, "image_url": url}
            if hasattr(PlaceImage, "caption"):
                kwargs["caption"] = f"{place.town} view {g}"
            if hasattr(PlaceImage, "is_primary"):
                kwargs["is_primary"] = g == 1
            img_batch.append(PlaceImage(**kwargs))
        if len(img_batch) >= 200:
            db.session.add_all(img_batch)
            db.session.commit()
            img_batch = []
    if img_batch:
        db.session.add_all(img_batch)
        db.session.commit()

    print(f"🎉 Events ({EVENTS_PER_CATEGORY} × 4)…")
    for key, category in category_map.items():
        cat_places = places_by_key[key]
        titles = EVENT_TITLES[key]
        events = []
        for i in range(1, EVENTS_PER_CATEGORY + 1):
            host = random.choice(cat_places)
            title_base = titles[(i - 1) % len(titles)]
            start = datetime.now(timezone.utc) + timedelta(days=random.randint(2, 120), hours=random.randint(8, 20))
            end = start + timedelta(hours=random.randint(2, 6))
            banner = f"https://picsum.photos/seed/gemspot-event-{key}-{i:03d}/1200/800"
            events.append(Event(
                place_id=host.place_id,
                venue_name=host.name,
                category_id=category.category_id,
                title=f"{title_base} #{i:03d} — {host.town}",
                description=f"Upcoming {category.name} around {host.town}, {host.county}.",
                start_date=start,
                end_date=end,
                ticket_price=random.choice([0, 500, 1000, 1500, 2000, 2500, 3000, 5000]),
                banner=banner,
                google_calendar_link="https://calendar.google.com",
                status="Upcoming",
            ))
        db.session.add_all(events)
        db.session.commit()
        print(f"   ✓ events: {category.name}")

    print("✨ Vibe checks…")
    reviewers = [test_user, *extras]
    sample = random.sample(all_places, k=min(150, len(all_places)))
    vibes = []
    for place in sample:
        author = random.choice(reviewers)
        uid = getattr(author, "user_id", None) or getattr(author, "id", None)
        kwargs = {}
        for field, value in [
            ("place_id", place.place_id),
            ("user_id", uid),
            ("rating", random.randint(3, 5)),
            ("comment", random.choice(VIBE_NOTES)),
            ("note", random.choice(VIBE_NOTES)),
            ("text", random.choice(VIBE_NOTES)),
        ]:
            if hasattr(VibeCheck, field):
                kwargs[field] = value
        try:
            vibes.append(VibeCheck(**kwargs))
        except TypeError:
            continue
    try:
        db.session.add_all(vibes)
        db.session.commit()
        print(f"   ✓ {len(vibes)} vibe checks")
    except Exception as exc:
        db.session.rollback()
        print(f"   ⚠ VibeCheck skipped: {exc}")

    # Sanity check: matatu_route must be readable
    try:
        sample_place = Place.query.first()
        _ = sample_place.matatu_route
        print("\n✅ Schema check passed — places.matatu_route is readable.")
    except Exception as exc:
        print(f"\n❌ Schema still broken: {exc}")
        raise

    print("\n✅ Seed complete.")
    print(f"   Places: {Place.query.count()} | Events: {Event.query.count()}")
    print(f"   Unique featured images: {len(used_images)}")
    print("   Demo admin: admin@gemspot.co.ke / AdminPass2026!")
    print("   Demo user:  wanjiku@example.com / Password123!")
    print("\nNext: restart Flask, then curl http://localhost:5000/api/places")


if __name__ == "__main__":
    try:
        from main import app
    except ImportError:
        from app import create_app
        app = create_app()
    with app.app_context():
        seed_data()
