from extensions import db
from datetime import datetime, timezone
from models.place_tag import place_tags


class Place(db.Model):
    """
    Core place model aligned with GemSpot KE frontend.

    Category-specific rich fields are stored as JSON so nature/action places
    can carry activities & gear, eats places menu highlights, and nightlife
    places music/drinks metadata without separate tables.
    """
    __tablename__ = 'places'

    place_id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.category_id'), nullable=False)
    name = db.Column(db.String(120), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)

    # Location & geospatial
    latitude = db.Column(db.Float, nullable=False, default=0.0)
    longitude = db.Column(db.Float, nullable=False, default=0.0)
    county = db.Column(db.String(50), nullable=False, default='Nairobi')
    town = db.Column(db.String(50), nullable=False, default='Nairobi')
    address = db.Column(db.String(255), nullable=True)
    matatu_route = db.Column(db.String(255), nullable=True)

    # Budget
    price_level = db.Column(db.String(30), nullable=False, default='Budget')  # Budget | Moderate | Mid-range | Premium | Luxury
    damage_for_two = db.Column(db.Integer, nullable=True)
    gate_fee = db.Column(db.String(50), default='None')

    # Amenities & logistics
    mpesa_available = db.Column(db.Boolean, default=True)
    till_number = db.Column(db.String(50), nullable=True)
    parking = db.Column(db.String(150), nullable=True)  # free-text or "true"/"false" for FE flexibility
    wifi = db.Column(db.Boolean, default=False)
    power_sockets = db.Column(db.Boolean, default=False)
    pet_friendly = db.Column(db.Boolean, default=False)
    is_indoor = db.Column(db.Boolean, default=True)
    dress_code = db.Column(db.String(150), default='Casual')
    reservation_required = db.Column(db.Boolean, default=False)
    opening_hours = db.Column(db.String(120), nullable=True)

    # Visuals & verification
    featured_image = db.Column(db.String(500), nullable=True)
    verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ---- Category-depth JSON fields (frontend placesData parity) ----
    # nature / action
    activities = db.Column(db.JSON, nullable=True)       # [{name, duration, intensity}]
    requirements = db.Column(db.JSON, nullable=True)     # [str]
    what_to_bring = db.Column(db.JSON, nullable=True)    # [str]
    best_time = db.Column(db.String(120), nullable=True)
    difficulty = db.Column(db.String(50), nullable=True)

    # eats
    menu_highlights = db.Column(db.JSON, nullable=True)  # [{name, price, note}]
    dietary = db.Column(db.JSON, nullable=True)          # [str]

    # nightlife
    music_vibe = db.Column(db.String(120), nullable=True)
    signature_drinks = db.Column(db.JSON, nullable=True)  # [str] or [{name, price}]
    peak_hours = db.Column(db.String(80), nullable=True)
    cover_charge = db.Column(db.String(50), nullable=True)

    # Relationships
    images = db.relationship('PlaceImage', backref='place', lazy=True, cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='place', lazy=True, cascade='all, delete-orphan')
    vibe_checks = db.relationship('VibeCheck', backref='place', lazy=True, cascade='all, delete-orphan')
    events = db.relationship('Event', backref='place', lazy=True, cascade='all, delete-orphan')
    favorites = db.relationship('Favorite', backref='place', lazy=True, cascade='all, delete-orphan')
    tags = db.relationship(
        'Tag',
        secondary=place_tags,
        lazy='subquery',
        backref=db.backref('places', lazy=True),
    )


class PlaceImage(db.Model):
    __tablename__ = 'place_images'

    image_id = db.Column(db.Integer, primary_key=True)
    place_id = db.Column(db.Integer, db.ForeignKey('places.place_id', ondelete='CASCADE'), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    caption = db.Column(db.String(150), nullable=True)
