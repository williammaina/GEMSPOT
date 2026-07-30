from extensions import db
from datetime import datetime, timezone

class VibeCheck(db.Model):
    __tablename__ = 'vibe_checks'

    vibe_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    place_id = db.Column(db.Integer, db.ForeignKey('places.place_id', ondelete='CASCADE'), nullable=False)
    
    # Real-time Status Data
    crowd_level = db.Column(db.String(30), nullable=False)       # e.g., 'Packed', 'Moderate', 'Quiet', 'Closed'
    weather_status = db.Column(db.String(50), nullable=True)     # e.g., 'Sunny', 'Light Rain', 'Overcast'
    vibe_tag = db.Column(db.String(50), nullable=True)           # e.g., 'Family Friendly', 'Chill', 'Loud DJ'
    video_url = db.Column(db.String(255), nullable=True)         # Short clip for VibeReel component
    caption = db.Column(db.String(150), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))