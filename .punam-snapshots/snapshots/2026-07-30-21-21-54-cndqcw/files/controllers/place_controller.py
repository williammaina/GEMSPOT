from flask import Blueprint, request, jsonify
from extensions import db
from models.place import Place, PlaceImage
from models.category import Tag
from schemas.place_schema import place_schema, places_schema
from flask_jwt_extended import jwt_required

place_bp = Blueprint('place', __name__, url_prefix='/api/places')

@place_bp.route('', methods=['GET'])
def get_places():
    query = Place.query

    category_id = request.args.get('category_id', type=int)
    county = request.args.get('county')
    price_level = request.args.get('price_level')
    is_indoor = request.args.get('is_indoor')
    search = request.args.get('search')

    if category_id:
        query = query.filter_by(category_id=category_id)
    if county:
        query = query.filter(Place.county.ilike(f"%{county}%"))
    if price_level:
        query = query.filter_by(price_level=price_level)
    if is_indoor is not None:
        indoor_bool = is_indoor.lower() in ['true', '1']
        query = query.filter_by(is_indoor=indoor_bool)
    if search:
        query = query.filter(
            (Place.name.ilike(f"%{search}%")) |
            (Place.town.ilike(f"%{search}%")) |
            (Place.description.ilike(f"%{search}%"))
        )

    places = query.all()
    return jsonify(places_schema.dump(places)), 200


@place_bp.route('/<int:place_id>', methods=['GET'])
def get_place(place_id):
    place = Place.query.get_or_404(place_id)
    return jsonify(place_schema.dump(place)), 200


@place_bp.route('', methods=['POST'])
@jwt_required()
def create_place():
    data = request.get_json() or {}
    
    required_fields = ['name', 'category_id', 'latitude', 'longitude', 'county', 'town']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f"Field '{field}' is required"}), 400

    place = Place(
        category_id=data['category_id'],
        name=data['name'],
        description=data.get('description'),
        latitude=data['latitude'],
        longitude=data['longitude'],
        county=data.get('county', 'Nairobi'),
        town=data['town'],
        address=data.get('address'),
        matatu_route=data.get('matatu_route'),
        price_level=data.get('price_level', 'Budget'),
        damage_for_two=data.get('damage_for_two'),
        gate_fee=data.get('gate_fee', 'None'),
        mpesa_available=data.get('mpesa_available', True),
        till_number=data.get('till_number'),
        parking=data.get('parking', True),
        wifi=data.get('wifi', False),
        power_sockets=data.get('power_sockets', False),
        pet_friendly=data.get('pet_friendly', False),
        is_indoor=data.get('is_indoor', True),
        dress_code=data.get('dress_code', 'Casual'),
        reservation_required=data.get('reservation_required', False),
        opening_hours=data.get('opening_hours'),
        featured_image=data.get('featured_image')
    )

    # Attach Tags if passed as a list of tag_ids
    if 'tag_ids' in data and isinstance(data['tag_ids'], list):
        tags = Tag.query.filter(Tag.tag_id.in_(data['tag_ids'])).all()
        place.tags.extend(tags)

    db.session.add(place)
    db.session.commit()

    return jsonify({'message': 'Place created successfully', 'place': place_schema.dump(place)}), 201


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
        caption=data.get('caption')
    )
    db.session.add(image)
    db.session.commit()

    return jsonify({'message': 'Image added successfully'}), 201