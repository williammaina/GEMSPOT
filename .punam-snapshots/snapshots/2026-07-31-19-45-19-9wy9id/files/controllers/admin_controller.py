from flask import Blueprint, jsonify, request
from extensions import db
from models.place import Place
from models.user import User
from models.event import Event
from models.review import Review
from schemas.user_schema import users_schema
from schemas.place_schema import places_schema
from schemas.event_schema import events_schema
from flask_jwt_extended import jwt_required, get_jwt_identity

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


def verify_admin(user_id):
    user = User.query.get(user_id)
    return user and user.is_admin


@admin_bp.route('', methods=['GET'])
@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Frontend AdminDashboard hits GET /api/admin"""
    user_id = int(get_jwt_identity())
    if not verify_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403

    payload = {
        'places_count': Place.query.count(),
        'events_count': Event.query.count(),
        'users_count': User.query.count(),
        'reviews_count': Review.query.count(),
        'total_places': Place.query.count(),
        'total_users': User.query.count(),
        'total_reviews': Review.query.count(),
        'places': Place.query.count(),
        'events': Event.query.count(),
        'users': User.query.count(),
    }
    return jsonify({'data': payload, **payload}), 200


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    user_id = int(get_jwt_identity())
    if not verify_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify(users_schema.dump(users)), 200


@admin_bp.route('/places', methods=['GET'])
@jwt_required()
def list_places():
    user_id = int(get_jwt_identity())
    if not verify_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403
    places = Place.query.order_by(Place.place_id.asc()).all()
    return jsonify(places_schema.dump(places)), 200


@admin_bp.route('/events', methods=['GET'])
@jwt_required()
def list_events():
    user_id = int(get_jwt_identity())
    if not verify_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403
    events = Event.query.order_by(Event.start_date.desc()).all()
    return jsonify(events_schema.dump(events)), 200


@admin_bp.route('/places/<int:place_id>/verify', methods=['PATCH'])
@jwt_required()
def verify_place(place_id):
    user_id = int(get_jwt_identity())
    if not verify_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403

    place = Place.query.get_or_404(place_id)
    place.verified = not place.verified
    db.session.commit()

    return jsonify({
        'message': f'Place verified status updated to {place.verified}',
        'verified': place.verified,
    }), 200


@admin_bp.route('/users/<int:target_id>/admin', methods=['PATCH'])
@jwt_required()
def toggle_admin(target_id):
    user_id = int(get_jwt_identity())
    if not verify_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403
    target = User.query.get_or_404(target_id)
    data = request.get_json() or {}
    if 'is_admin' in data:
        target.is_admin = bool(data['is_admin'])
    else:
        target.is_admin = not target.is_admin
    db.session.commit()
    return jsonify({'message': 'Admin flag updated', 'is_admin': target.is_admin}), 200
