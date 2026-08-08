from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.user import User
from models.place import Place
from models.event import Event
from models.review import Review
from schemas.user_schema import users_schema, user_schema
from schemas.place_schema import places_schema
from schemas.event_schema import events_schema

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


def verify_admin(user_id):
    user = User.query.get(user_id)
    return user and user.is_admin


def admin_count():
    return User.query.filter_by(is_admin=True).count()


@admin_bp.route('', methods=['GET'])
@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def stats():
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
        'admins_count': admin_count(),
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


@admin_bp.route('/users', methods=['POST'])
@jwt_required()
def create_user():
    """Admin creates a user (optionally as admin)."""
    actor_id = int(get_jwt_identity())
    if not verify_admin(actor_id):
        return jsonify({'error': 'Admin access required'}), 403

    data = request.get_json() or {}
    email = str(data.get('email') or '').strip().lower()
    username = str(data.get('username') or email.split('@')[0] or '').strip().lower()
    password = data.get('password') or ''
    first_name = (data.get('first_name') or data.get('name') or 'User').strip()
    last_name = (data.get('last_name') or '').strip()
    make_admin = bool(data.get('is_admin'))

    if not email or not password:
        return jsonify({'error': 'email and password are required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 400

    user = User(
        first_name=first_name,
        last_name=last_name or 'Account',
        username=username,
        email=email,
        is_admin=make_admin,
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({
        'message': 'User created',
        'user': user_schema.dump(user),
        'data': user_schema.dump(user),
    }), 201


@admin_bp.route('/users/<int:target_id>', methods=['DELETE'])
@jwt_required()
def delete_user(target_id):
    """
    Delete a user with safety rails:
    - Cannot delete yourself (avoids locking out mid-session)
    - Cannot delete the last remaining admin
    """
    actor_id = int(get_jwt_identity())
    if not verify_admin(actor_id):
        return jsonify({'error': 'Admin access required'}), 403

    if target_id == actor_id:
        return jsonify({
            'error': 'You cannot delete your own account while signed in. Ask another admin, or demote after promoting someone else.',
        }), 400

    target = User.query.get_or_404(target_id)

    if target.is_admin and admin_count() <= 1:
        return jsonify({
            'error': 'Cannot delete the last admin. Promote another user to admin first.',
        }), 400

    db.session.delete(target)
    db.session.commit()
    return jsonify({'message': 'User deleted', 'deleted_id': target_id}), 200


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

    new_flag = bool(data['is_admin']) if 'is_admin' in data else (not target.is_admin)

    # Prevent demoting / removing the last admin
    if target.is_admin and not new_flag and admin_count() <= 1:
        return jsonify({
            'error': 'Cannot remove the last admin. Promote another user first.',
        }), 400

    if target_id == user_id and not new_flag and admin_count() <= 1:
        return jsonify({
            'error': 'You cannot demote yourself as the last admin.',
        }), 400

    target.is_admin = new_flag
    db.session.commit()
    return jsonify({'message': 'Admin flag updated', 'is_admin': target.is_admin}), 200