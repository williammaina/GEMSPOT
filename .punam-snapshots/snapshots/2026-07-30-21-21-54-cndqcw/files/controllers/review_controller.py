from flask import Blueprint, request, jsonify
from extensions import db
from models.review import Review
from models.place import Place
from schemas.review_schema import review_schema, reviews_schema
from flask_jwt_extended import jwt_required, get_jwt_identity

review_bp = Blueprint('review', __name__, url_prefix='/api/reviews')

@review_bp.route('/place/<int:place_id>', methods=['GET'])
def get_place_reviews(place_id):
    Place.query.get_or_404(place_id)
    reviews = Review.query.filter_by(place_id=place_id).order_by(Review.created_at.desc()).all()
    return jsonify(reviews_schema.dump(reviews)), 200


@review_bp.route('/place/<int:place_id>', methods=['POST'])
@jwt_required()
def add_review(place_id):
    user_id = int(get_jwt_identity())
    Place.query.get_or_404(place_id)
    data = request.get_json() or {}

    rating = data.get('rating')
    if not rating or not (1 <= int(rating) <= 5):
        return jsonify({'error': 'Valid rating between 1 and 5 is required'}), 400

    review = Review(
        user_id=user_id,
        place_id=place_id,
        rating=int(rating),
        review_text=data.get('review_text'),
        image_url=data.get('image_url'),
        video_url=data.get('video_url')
    )
    db.session.add(review)
    db.session.commit()

    return jsonify({'message': 'Review added', 'review': review_schema.dump(review)}), 201


@review_bp.route('/<int:review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id):
    user_id = int(get_jwt_identity())
    review = Review.query.get_or_404(review_id)

    if review.user_id != user_id:
        return jsonify({'error': 'Unauthorized action'}), 403

    db.session.delete(review)
    db.session.commit()
    return jsonify({'message': 'Review deleted successfully'}), 200