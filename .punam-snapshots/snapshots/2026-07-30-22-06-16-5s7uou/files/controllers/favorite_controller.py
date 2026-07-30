from flask import Blueprint, jsonify
from extensions import db
from models.favorite import Favorite
from models.place import Place
from schemas.favorite_schema import favorites_schema
from flask_jwt_extended import jwt_required, get_jwt_identity

favorite_bp = Blueprint('favorite', __name__, url_prefix='/api/favorites')

@favorite_bp.route('', methods=['GET'])
@jwt_required()
def get_user_favorites():
    user_id = int(get_jwt_identity())
    favorites = Favorite.query.filter_by(user_id=user_id).all()
    return jsonify(favorites_schema.dump(favorites)), 200


@favorite_bp.route('/<int:place_id>', methods=['POST'])
@jwt_required()
def add_favorite(place_id):
    user_id = int(get_jwt_identity())
    Place.query.get_or_404(place_id)

    existing = Favorite.query.filter_by(user_id=user_id, place_id=place_id).first()
    if existing:
        return jsonify({'message': 'Place is already favorited'}), 200

    favorite = Favorite(user_id=user_id, place_id=place_id)
    db.session.add(favorite)
    db.session.commit()
    return jsonify({'message': 'Added to favorites'}), 201


@favorite_bp.route('/<int:place_id>', methods=['DELETE'])
@jwt_required()
def remove_favorite(place_id):
    user_id = int(get_jwt_identity())
    favorite = Favorite.query.filter_by(user_id=user_id, place_id=place_id).first_or_404()

    db.session.delete(favorite)
    db.session.commit()
    return jsonify({'message': 'Removed from favorites'}), 200