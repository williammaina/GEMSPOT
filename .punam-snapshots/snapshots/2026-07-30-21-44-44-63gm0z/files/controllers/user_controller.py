from flask import Blueprint, request, jsonify
from extensions import db
from models.user import User
from schemas.user_schema import user_schema, users_schema
from flask_jwt_extended import jwt_required, get_jwt_identity

user_bp = Blueprint('user', __name__, url_prefix='/api/users')

@user_bp.route('/<int:user_id>', methods=['GET'])
def get_profile(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user_schema.dump(user)), 200

@user_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = int(get_jwt_identity())
    user = User.query.get_or_404(current_user_id)
    data = request.get_json() or {}

    user.first_name = data.get('first_name', user.first_name)
    user.last_name = data.get('last_name', user.last_name)
    user.phone = data.get('phone', user.phone)
    user.bio = data.get('bio', user.bio)
    user.profile_image = data.get('profile_image', user.profile_image)

    db.session.commit()
    return jsonify({'message': 'Profile updated successfully', 'user': user_schema.dump(user)}), 200