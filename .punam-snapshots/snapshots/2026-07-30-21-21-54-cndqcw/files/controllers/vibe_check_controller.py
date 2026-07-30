from flask import Blueprint, request, jsonify
from extensions import db
from models.vibe_check import VibeCheck
from models.place import Place
from schemas.vibe_schema import vibe_schema, vibes_schema
from flask_jwt_extended import jwt_required, get_jwt_identity

vibe_bp = Blueprint('vibe', __name__, url_prefix='/api/vibes')

@vibe_bp.route('/reels', methods=['GET'])
def get_vibe_reels():
    # Fetch latest vibe entries that contain videos for VibeReel frontend UI
    reels = VibeCheck.query.filter(VibeCheck.video_url.isnot(None)).order_by(VibeCheck.created_at.desc()).limit(20).all()
    return jsonify(vibes_schema.dump(reels)), 200


@vibe_bp.route('/place/<int:place_id>', methods=['GET'])
def get_place_vibes(place_id):
    Place.query.get_or_404(place_id)
    vibes = VibeCheck.query.filter_by(place_id=place_id).order_by(VibeCheck.created_at.desc()).all()
    return jsonify(vibes_schema.dump(vibes)), 200


@vibe_bp.route('/place/<int:place_id>', methods=['POST'])
@jwt_required()
def add_vibe_check(place_id):
    user_id = int(get_jwt_identity())
    Place.query.get_or_404(place_id)
    data = request.get_json() or {}

    if not data.get('crowd_level'):
        return jsonify({'error': 'crowd_level is required (e.g. Packed, Quiet)'}), 400

    vibe = VibeCheck(
        user_id=user_id,
        place_id=place_id,
        crowd_level=data['crowd_level'],
        weather_status=data.get('weather_status'),
        vibe_tag=data.get('vibe_tag'),
        video_url=data.get('video_url'),
        caption=data.get('caption')
    )
    db.session.add(vibe)
    db.session.commit()

    return jsonify({'message': 'Vibe check updated', 'vibe': vibe_schema.dump(vibe)}), 201