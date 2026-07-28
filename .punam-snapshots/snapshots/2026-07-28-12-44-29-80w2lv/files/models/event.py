from extensions import db
from datetime import datetime, timezone

class Event(db.Model):
    __tablename__ = 'events'

    event_id = db.Column(db.Integer, primary_key=True)
    place_id = db.Column(db.Integer, db.ForeignKey('places.place_id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    ticket_price = db.Column(db.Integer, default=0)
    banner = db.Column(db.String(255), nullable=True)
    google_calendar_link = db.Column(db.String(500), nullable=True)
    status = db.Column(db.String(20), default='Upcoming')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class EventBookmark(db.Model):
    __tablename__ = 'event_bookmarks'

    bookmark_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('events.event_id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))