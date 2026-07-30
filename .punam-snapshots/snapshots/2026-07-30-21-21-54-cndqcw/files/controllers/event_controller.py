from flask import Blueprint, request, jsonify
from extensions import db
from models.event import Event, EventBookmark
from schemas.event_schema import event_schema, events_schema, event_bookmark_schema, event_bookmarks_schema
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

event_bp = Blueprint('event', __name__, url_prefix='/api/events')

@event_bp.route('', methods=['GET'])
def get_events():
    events = Event.query.order_by(Event.start_date.asc()).all()
    return jsonify(events_schema.dump(events)), 200


@event_bp.route('/<int:event_id>', methods=['GET'])
def get_event(event_id):
    event = Event.query.get_or_404(event_id)
    return jsonify(event_schema.dump(event)), 200


@event_bp.route('', methods=['POST'])
@jwt_required()
def create_event():
    data = request.get_json() or {}
    
    required = ['title', 'start_date', 'end_date']
    for req in required:
        if not data.get(req):
            return jsonify({'error': f"Field '{req}' is required"}), 400

    event = Event(
        place_id=data.get('place_id'),
        venue_name=data.get('venue_name'),
        category_id=data.get('category_id'),
        title=data['title'],
        description=data.get('description'),
        start_date=datetime.fromisoformat(data['start_date']),
        end_date=datetime.fromisoformat(data['end_date']),
        ticket_price=data.get('ticket_price', 0),
        banner=data.get('banner'),
        google_calendar_link=data.get('google_calendar_link')
    )
    db.session.add(event)
    db.session.commit()

    return jsonify({'message': 'Event created successfully', 'event': event_schema.dump(event)}), 201


@event_bp.route('/<int:event_id>/bookmark', methods=['POST'])
@jwt_required()
def toggle_bookmark(event_id):
    user_id = int(get_jwt_identity())
    Event.query.get_or_404(event_id)

    existing = EventBookmark.query.filter_by(user_id=user_id, event_id=event_id).first()
    if existing:
        db.session.delete(existing)
        db.session.commit()
        return jsonify({'message': 'Bookmark removed', 'bookmarked': False}), 200

    bookmark = EventBookmark(user_id=user_id, event_id=event_id)
    db.session.add(bookmark)
    db.session.commit()
    return jsonify({'message': 'Event bookmarked', 'bookmarked': True}), 201


@event_bp.route('/user/bookmarks', methods=['GET'])
@jwt_required()
def get_user_bookmarks():
    user_id = int(get_jwt_identity())
    bookmarks = EventBookmark.query.filter_by(user_id=user_id).all()
    return jsonify(event_bookmarks_schema.dump(bookmarks)), 200