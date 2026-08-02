from flask import Blueprint, request, jsonify
from extensions import db
from models.event import Event, EventBookmark
from models.category import Category
from schemas.event_schema import (
    event_schema,
    events_schema,
    event_bookmarks_schema,
)
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from utils.category_map import filter_category_ids, resolve_category_id

event_bp = Blueprint('event', __name__, url_prefix='/api/events')


def _parse_dt(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    s = str(value).replace('Z', '+00:00')
    # datetime-local from admin: 2026-07-31T14:00
    try:
        return datetime.fromisoformat(s)
    except ValueError:
        for fmt in ('%Y-%m-%dT%H:%M', '%Y-%m-%d %H:%M', '%Y-%m-%d'):
            try:
                return datetime.strptime(str(value), fmt)
            except ValueError:
                continue
    return None


def _apply_event_fields(event, data):
    if data.get('title'):
        event.title = data['title']
    if 'description' in data:
        event.description = data.get('description')
    if 'place_id' in data:
        event.place_id = data.get('place_id')
    venue = data.get('venue_name') or data.get('location')
    if venue is not None:
        event.venue_name = venue
    start = _parse_dt(data.get('start_date') or data.get('startDate'))
    if start:
        event.start_date = start
    end = _parse_dt(data.get('end_date') or data.get('endDate'))
    if end:
        event.end_date = end
    elif start and not event.end_date:
        event.end_date = start

    price = data.get('ticket_price')
    if price is None:
        price = data.get('price')
    if price is not None:
        try:
            # "KES 1,500" or "Free" or number
            if isinstance(price, str):
                cleaned = price.lower().replace('kes', '').replace(',', '').strip()
                if cleaned in ('free', 'free entry', ''):
                    event.ticket_price = 0
                else:
                    event.ticket_price = int(float(cleaned))
            else:
                event.ticket_price = int(price)
        except (TypeError, ValueError):
            pass

    banner = data.get('banner') or data.get('image')
    if banner is not None:
        event.banner = banner
    if 'google_calendar_link' in data:
        event.google_calendar_link = data.get('google_calendar_link')
    if 'status' in data:
        event.status = data.get('status') or event.status

    host = data.get('host')
    if isinstance(host, dict):
        event.host_name = host.get('name') or event.host_name
        event.host_org = host.get('org') or event.host_org
    else:
        if data.get('host_name'):
            event.host_name = data['host_name']
        if data.get('host_org'):
            event.host_org = data['host_org']

    if data.get('going_count') is not None or data.get('goingCount') is not None:
        try:
            event.going_count = int(data.get('going_count', data.get('goingCount', 0)))
        except (TypeError, ValueError):
            pass

    tags = data.get('tags')
    if tags is not None:
        event.tags = tags if isinstance(tags, list) else [tags]

    cat_id = resolve_category_id(Category, data)
    if cat_id:
        event.category_id = cat_id


@event_bp.route('', methods=['GET'])
def get_events():
    query = Event.query

    category_slug = request.args.get('category') or request.args.get('cat')
    search = request.args.get('search') or request.args.get('q') or request.args.get('query')

    if category_slug and category_slug.lower() not in ('all', ''):
        ids = filter_category_ids(Category, category_slug)
        if ids is not None:
            if not ids:
                return jsonify([]), 200
            query = query.filter(Event.category_id.in_(ids))

    if search:
        like = f"%{search}%"
        query = query.filter(
            (Event.title.ilike(like)) |
            (Event.venue_name.ilike(like)) |
            (Event.description.ilike(like))
        )

    events = query.order_by(Event.start_date.asc()).all()
    return jsonify(events_schema.dump(events)), 200


@event_bp.route('/<int:event_id>', methods=['GET'])
def get_event(event_id):
    event = Event.query.get_or_404(event_id)
    return jsonify(event_schema.dump(event)), 200


@event_bp.route('', methods=['POST'])
@jwt_required()
def create_event():
    data = request.get_json() or {}

    if not data.get('title'):
        return jsonify({'error': "Field 'title' is required"}), 400

    start = _parse_dt(data.get('start_date') or data.get('startDate'))
    if not start:
        start = datetime.utcnow()

    event = Event(
        title=data['title'],
        start_date=start,
        end_date=_parse_dt(data.get('end_date') or data.get('endDate')) or start,
    )
    _apply_event_fields(event, data)
    db.session.add(event)
    db.session.commit()

    return jsonify({
        'message': 'Event created successfully',
        'event': event_schema.dump(event),
        'data': event_schema.dump(event),
    }), 201


@event_bp.route('/<int:event_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_event(event_id):
    event = Event.query.get_or_404(event_id)
    data = request.get_json() or {}
    _apply_event_fields(event, data)
    db.session.commit()
    return jsonify({
        'message': 'Event updated successfully',
        'event': event_schema.dump(event),
        'data': event_schema.dump(event),
    }), 200


@event_bp.route('/<int:event_id>', methods=['DELETE'])
@jwt_required()
def delete_event(event_id):
    event = Event.query.get_or_404(event_id)
    db.session.delete(event)
    db.session.commit()
    return jsonify({'message': 'Event deleted successfully'}), 200


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
