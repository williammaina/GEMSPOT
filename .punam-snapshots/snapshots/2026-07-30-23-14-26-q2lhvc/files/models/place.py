from extensions import db
from datetime import datetime, timezone
from models.place_tag import place_tags

class Place(db.Model):
    __tablename__ = 'places'

    place_id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.category_id'), nullable=False)
    name = db.Column(db.String(120), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    
    # Location & Mapbox Geospatial Data
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    county = db.Column(db.String(50), nullable=False, default='Nairobi')
    town = db.Column(db.String(50), nullable=False)
    address = db.Column(db.String(255), nullable=True)
    matatu_route = db.Column(db.String(150), nullable=True)  # e.g., "122 from Odeon"
    
    # Budget Intelligence
    price_level = db.Column(db.String(20), nullable=False, default='Budget')  # Under 1.5k, 1.5k-3k, etc.
    damage_for_two = db.Column(db.Integer, nullable=True)                      # e.g., 2500
    gate_fee = db.Column(db.String(50), default='None')                       # e.g., "None" or "500 KES"
    
    # Local Amenities & Logistics
    mpesa_available = db.Column(db.Boolean, default=True)
    till_number = db.Column(db.String(50), nullable=True)
    parking = db.Column(db.Boolean, default=True)
    wifi = db.Column(db.Boolean, default=False)
    power_sockets = db.Column(db.Boolean, default=False)                       # For work-friendly cafes
    pet_friendly = db.Column(db.Boolean, default=False)
    is_indoor = db.Column(db.Boolean, default=True)                           # Used for PlanBAlert weather filtering
    dress_code = db.Column(db.String(50), default='Casual')                   # Smart Casual, Casual, etc.
    reservation_required = db.Column(db.Boolean, default=False)
    opening_hours = db.Column(db.String(100), nullable=True)
    
    # Visuals & Verification
    featured_image = db.Column(db.String(255), nullable=True)
    verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    images = db.relationship('PlaceImage', backref='place', lazy=True, cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='place', lazy=True, cascade='all, delete-orphan')
    vibe_checks = db.relationship('VibeCheck', backref='place', lazy=True, cascade='all, delete-orphan')
    events = db.relationship('Event', backref='place', lazy=True, cascade='all, delete-orphan')
    favorites = db.relationship('Favorite', backref='place', lazy=True, cascade='all, delete-orphan')
    tags = db.relationship('Tag', secondary=place_tags, lazy='subquery', backref=db.backref('places', lazy=True))


class PlaceImage(db.Model):
    __tablename__ = 'place_images'

    image_id = db.Column(db.Integer, primary_key=True)
    place_id = db.Column(db.Integer, db.ForeignKey('places.place_id', ondelete='CASCADE'), nullable=False)
    image_url = db.Column(db.String(255), nullable=False)
    caption = db.Column(db.String(150), nullable=True)