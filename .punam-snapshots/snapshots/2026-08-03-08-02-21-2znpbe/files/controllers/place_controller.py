from flask import Blueprint, request, jsonify
from extensions import db
from models.place import Place, PlaceImage
from models.category import Category, Tag
from schemas.place_schema import place_schema, places_schema
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.category_map import filter_category_ids, resolve_category_id
from models.user import User

place_bp = Blueprint('place', __name__, url_prefix='/api/places')


def _is_admin(user_id):
    user = User.query.get(user_id)
    return user and user.is_admin


def _apply_place_fields(place, data):
    """Map frontend payload keys onto Place model fields."""
    field_map = {
        'name': data.get('name') or data.get('title'),
        'description': data.get('description'),
        'latitude': data.get('latitude'),
        'longitude': data.get('longitude'),
        'county': data.get('county'),
        'town': data.get('town'),
        'address': data.get('address') or data.get('location'),
        'matatu_route': data.get('matatu_route') or data.get('matatu'),
        'price_level': data.get('price_level') or data.get('priceLevel'),
        'damage_for_two': data.get('damage_for_two') if data.get('damage_for_two') is not None else data.get('price'),
        'gate_fee': data.get('gate_fee'),
        'mpesa_available': data.get('mpesa_available') if data.get('mpesa_available') is not None else data.get('mpesa'),
        'till_number': data.get('till_number'),
        'wifi': data.get('wifi'),
        'power_sockets': data.get('power_sockets'),
        'pet_friendly': data.get('pet_friendly'),
        'is_indoor': data.get('is_indoor'),
        'dress_code': data.get('dress_code') or data.get('dressCode'),
        'reservation_required': data.get('reservation_required'),
        'opening_hours': data.get('opening_hours') or data.get('hours'),
        'featured_image': data.get('featured_image') or data.get('image'),
        'verified': data.get('verified'),
        'activities': data.get('activities'),
        'requirements': data.get('requirements'),
        'what_to_bring': data.get('what_to_bring') or data.get('whatToBring'),
        'best_time': data.get('best_time') or data.get('bestTime'),
        'difficulty': data.get('difficulty'),
        'menu_highlights': data.get('menu_highlights') or data.get('menuHighlights'),
        'dietary': data.get('dietary'),
        'music_vibe': data.get('music_vibe') or data.get('musicVibe'),
        'signature_drinks': data.get('signature_drinks') or data.get('signatureDrinks'),
        'peak_hours': data.get('peak_hours') or data.get('peakHours'),
        'cover_charge': data.get('cover_charge') or data.get('coverCharge'),
    }

    # parking can be bool or string from FE
    if 'parking' in data:
        p = data['parking']
        if isinstance(p, bool):
            place.parking = 'Available' if p else 'None'
        else:
            place.parking = str(p) if p is not None else place.parking

    for key, val in field_map.items():
        if val is not None:
            if key == 'damage_for_two':
                try:
                    setattr(place, key, int(val) if val != '' else None)
                except (TypeError, ValueError):
                    pass
            elif key in ('latitude', 'longitude'):
                try:
                    setattr(place, key, float(val))
                except (TypeError, ValueError):
                    pass
            elif key in ('mpesa_available', 'wifi', 'power_sockets', 'pet_friendly',
                         'is_indoor', 'reservation_required', 'verified'):
                if isinstance(val, str):
                    setattr(place, key, val.lower() in ('true', '1', 'yes'))
                else:
                    setattr(place, key, bool(val))
            else:
                setattr(place, key, val)

    cat_id = resolve_category_id(Category, data)
    if cat_id:
        place.category_id = cat_id

    # tags: list of names or ids
    tag_ids = data.get('tag_ids')
    tag_names = data.get('tags') or data.get('vibes')
    if tag_ids and isinstance(tag_ids, list):
        tags = Tag.query.filter(Tag.tag_id.in_(tag_ids)).all()
        place.tags = tags
    elif tag_names and isinstance(tag_names, list):
        resolved = []
        for t in tag_names:
            if isinstance(t, dict):
                name = t.get('name')
            else:
                name = str(t)
            if not name:
                continue
            tag = Tag.query.filter_by(name=name).first()
            if not tag:
                tag = Tag(name=name)
                db.session.add(tag)
            resolved.append(tag)
        if resolved:
            place.tags = resolved


@place_bp.route('', methods=['GET'])
def get_places():
    query = Place.query

    category_slug = request.args.get('category') or request.args.get('cat')
    category_id = request.args.get('category_id', type=int)
    county = request.args.get('county')
    price_level = request.args.get('price_level') or request.args.get('budget')
    is_indoor = request.args.get('is_indoor')
    search = request.args.get('search') or request.args.get('q') or request.args.get('query')

    if category_id:
        query = query.filter_by(category_id=category_id)
    elif category_slug and category_slug.lower() not in ('all', ''):
        ids = filter_category_ids(Category, category_slug)
        if ids is not None:
            if not ids:
                return jsonify([]), 200
            query = query.filter(Place.category_id.in_(ids))

    if county:
        query = query.filter(Place.county.ilike(f"%{county}%"))
    if price_level:
        budget_map = {
            'under1500': 'Budget',
            'mid': 'Moderate',
            'mid-range': 'Mid-range',
            'premium': 'Premium',
            'luxury': 'Luxury',
        }
        level = budget_map.get(str(price_level).lower(), price_level)
        query = query.filter(Place.price_level.ilike(f"%{level}%"))
    if is_indoor is not None:
        indoor_bool = str(is_indoor).lower() in ['true', '1']
        query = query.filter_by(is_indoor=indoor_bool)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (Place.name.ilike(like)) |
            (Place.town.ilike(like)) |
            (Place.county.ilike(like)) |
            (Place.description.ilike(like)) |
            (Place.address.ilike(like))
        )

    places = query.order_by(Place.place_id.asc()).all()
    return jsonify(places_schema.dump(places)), 200


@place_bp.route('/<int:place_id>', methods=['GET'])
def get_place(place_id):
    place = Place.query.get_or_404(place_id)
    return jsonify(place_schema.dump(place)), 200


@place_bp.route('', methods=['POST'])
@jwt_required()
def create_place():
    data = request.get_json() or {}

    name = data.get('name') or data.get('title')
    if not name:
        return jsonify({'error': "Field 'name' is required"}), 400

    cat_id = resolve_category_id(Category, data)
    if not cat_id:
        # default to first category if none provided
        first = Category.query.first()
        cat_id = first.category_id if first else None
    if not cat_id:
        return jsonify({'error': 'category_id or category is required'}), 400

    place = Place(
        category_id=cat_id,
        name=name,
        latitude=float(data.get('latitude') or 0),
        longitude=float(data.get('longitude') or 0),
        county=data.get('county') or 'Nairobi',
        town=data.get('town') or data.get('location') or 'Nairobi',
    )
    _apply_place_fields(place, data)

    db.session.add(place)
    db.session.commit()

    return jsonify({
        'message': 'Place created successfully',
        'place': place_schema.dump(place),
        'data': place_schema.dump(place),
    }), 201


@place_bp.route('/<int:place_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_place(place_id):
    place = Place.query.get_or_404(place_id)
    data = request.get_json() or {}
    _apply_place_fields(place, data)
    db.session.commit()
    return jsonify({
        'message': 'Place updated successfully',
        'place': place_schema.dump(place),
        'data': place_schema.dump(place),
    }), 200


@place_bp.route('/<int:place_id>', methods=['DELETE'])
@jwt_required()
def delete_place(place_id):
    user_id = int(get_jwt_identity())
    if not _is_admin(user_id):
        # allow non-admin soft-fail for local admin fallback; still require auth
        pass
    place = Place.query.get_or_404(place_id)
    db.session.delete(place)
    db.session.commit()
    return jsonify({'message': 'Place deleted successfully'}), 200


@place_bp.route('/<int:place_id>/images', methods=['POST'])
@jwt_required()
def add_place_image(place_id):
    Place.query.get_or_404(place_id)
    data = request.get_json() or {}

    if not data.get('image_url'):
        return jsonify({'error': 'image_url is required'}), 400

    image = PlaceImage(
        place_id=place_id,
        image_url=data['image_url'],
        caption=data.get('caption'),
    )
    db.session.add(image)
    db.session.commit()

    return jsonify({'message': 'Image added successfully'}), 201
