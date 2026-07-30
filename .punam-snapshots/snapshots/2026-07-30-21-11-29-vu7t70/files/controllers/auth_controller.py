from flask import Blueprint, request, jsonify
from extensions import db
from models.user import User
from schemas.user_schema import user_schema
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    
    required_fields = ['first_name', 'last_name', 'username', 'email', 'password']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f"Field '{field}' is required"}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already taken'}), 400

    user = User(
        first_name=data['first_name'],
        last_name=data['last_name'],
        username=data['username'],
        email=data['email'],
        phone=data.get('phone'),
        bio=data.get('bio')
    )
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.user_id))
    return jsonify({
        'message': 'User registered successfully',
        'access_token': token,
        'user': user_schema.dump(user)
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = create_access_token(identity=str(user.user_id))
    return jsonify({
        'message': 'Login successful',
        'access_token': token,
        'user': user_schema.dump(user)
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(int(user_id))
    return jsonify(user_schema.dump(user)), 200