from extensions import db
from datetime import datetime, timezone
from models.place_tag import place_tags

class Place(db.Model):
    __tablename__ = 'places'

    place_id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.category_id'), nullable=False)
    name = db.Column(db.String(120), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    county = db.Column(db.String(50), nullable=False, default='Nairobi')
    town = db.Column(db.String(50), nullable=False)
    address = db.Column(db.String(255), nullable=True)
    price_level = db.Column(db.String(20), nullable=False, default='Budget')
    damage_for_two = db.Column(db.Integer, nullable=True)
    mpesa_available = db.Column(db.Boolean, default=True)
    parking = db.Column(db.Boolean, default=True)
    wifi = db.Column(db.Boolean, default=False)
    pet_friendly = db.Column(db.Boolean, default=False)
    dress_code = db.Column(db.String(50), default='Casual')
    opening_hours = db.Column(db.String(100), nullable=True)
    featured_image = db.Column(db.String(255), nullable=True)
    verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class PlaceImage(db.Model):
    __tablename__ = 'place_images'

    image_id = db.Column(db.Integer, primary_key=True)
    place_id = db.Column(db.Integer, db.ForeignKey('places.place_id', ondelete='CASCADE'), nullable=False)
    image_url = db.Column(db.String(255), nullable=False)
    caption = db.Column(db.String(150), nullable=True)