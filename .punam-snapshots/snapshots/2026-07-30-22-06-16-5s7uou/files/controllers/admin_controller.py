from flask import Blueprint, jsonify
from extensions import db
from models.place import Place
from models.user import User
from models.review import Review
from flask_jwt_extended import jwt_required, get_jwt_identity

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

def verify_admin(user_id):
    user = User.query.get(user_id)
    return user and user.is_admin


@admin_bp.route('/places/<int:place_id>/verify', methods=['PATCH'])
@jwt_required()
def verify_place(place_id):
    user_id = int(get_jwt_identity())
    if not verify_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403

    place = Place.query.get_or_404(place_id)
    place.verified = not place.verified
    db.session.commit()

    return jsonify({'message': f"Place verified status updated to {place.verified}"}), 200


@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    user_id = int(get_jwt_identity())
    if not verify_admin(user_id):
        return jsonify({'error': 'Admin access required'}), 403

    return jsonify({
        'total_users': User.query.count(),
        'total_places': Place.query.count(),
        'total_reviews': Review.query.count()
    }), 200