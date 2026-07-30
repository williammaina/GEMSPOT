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
    # Frontend may send only name/email/password — soft-fill
    if not data.get('first_name') and data.get('name'):
        parts = str(data['name']).split(None, 1)
        data['first_name'] = parts[0]
        data['last_name'] = parts[1] if len(parts) > 1 else parts[0]
    if not data.get('username') and data.get('email'):
        data['username'] = str(data['email']).split('@')[0]

    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f"Field '{field}' is required", 'message': f"Field '{field}' is required"}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered', 'message': 'Email already registered'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already taken', 'message': 'Username already taken'}), 400

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
    profile = user_schema.dump(user)
    return jsonify({
        'message': 'User registered successfully',
        'access_token': token,
        'token': token,
        'user': profile
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email') or data.get('username')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required', 'message': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User.query.filter_by(username=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password', 'message': 'Invalid email or password'}), 401

    token = create_access_token(identity=str(user.user_id))
    profile = user_schema.dump(user)
    return jsonify({
        'message': 'Login successful',
        'access_token': token,
        'token': token,
        'user': profile
    }), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required(optional=True)
def logout():
    return jsonify({'message': 'Logged out'}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(int(user_id))
    return jsonify(user_schema.dump(user)), 200
