from extensions import db
from datetime import datetime, timezone


class VibeCheck(db.Model):
    __tablename__ = 'vibe_checks'

    vibe_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    place_id = db.Column(db.Integer, db.ForeignKey('places.place_id', ondelete='CASCADE'), nullable=False)

    crowd_level = db.Column(db.String(30), nullable=False)  # Packed | Moderate | Quiet | Closed
    weather_status = db.Column(db.String(50), nullable=True)
    vibe_tag = db.Column(db.String(50), nullable=True)
    video_url = db.Column(db.String(500), nullable=True)
    caption = db.Column(db.String(150), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
