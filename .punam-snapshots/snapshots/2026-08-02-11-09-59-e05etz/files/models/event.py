from extensions import db
from datetime import datetime, timezone


class Event(db.Model):
    __tablename__ = 'events'

    event_id = db.Column(db.Integer, primary_key=True)
    place_id = db.Column(
        db.Integer,
        db.ForeignKey('places.place_id', ondelete='CASCADE'),
        nullable=True,
    )
    venue_name = db.Column(db.String(120), nullable=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.category_id'), nullable=True)

    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=True)
    ticket_price = db.Column(db.Integer, default=0)
    banner = db.Column(db.String(500), nullable=True)
    google_calendar_link = db.Column(db.String(500), nullable=True)
    status = db.Column(db.String(20), default='Upcoming')  # Upcoming | Ongoing | Ended

    # Frontend event card extras
    host_name = db.Column(db.String(120), nullable=True)
    host_org = db.Column(db.String(150), nullable=True)
    going_count = db.Column(db.Integer, default=0)
    tags = db.Column(db.JSON, nullable=True)  # ["Food & Drink", ...]

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    bookmarks = db.relationship(
        'EventBookmark',
        backref='event',
        lazy=True,
        cascade='all, delete-orphan',
    )
    category = db.relationship('Category', backref='events', lazy=True)


class EventBookmark(db.Model):
    __tablename__ = 'event_bookmarks'

    bookmark_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('events.event_id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
