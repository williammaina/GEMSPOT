from flask import Blueprint, request, jsonify
from extensions import db
from models.category import Category, Tag
from schemas.category_schema import category_schema, categories_schema, tag_schema, tags_schema
from flask_jwt_extended import jwt_required

category_bp = Blueprint('category', __name__, url_prefix='/api/categories')


@category_bp.route('', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify(categories_schema.dump(categories)), 200


@category_bp.route('', methods=['POST'])
@jwt_required()
def create_category():
    data = request.get_json() or {}
    if not data.get('name'):
        return jsonify({'error': 'Category name is required'}), 400

    category = Category(
        name=data['name'],
        icon=data.get('icon'),
        description=data.get('description'),
        theme_color=data.get('theme_color', 'Emerald'),
    )
    db.session.add(category)
    db.session.commit()

    return jsonify(category_schema.dump(category)), 201


@category_bp.route('/tags', methods=['GET'])
def get_tags():
    tags = Tag.query.all()
    return jsonify(tags_schema.dump(tags)), 200


@category_bp.route('/tags', methods=['POST'])
@jwt_required()
def create_tag():
    data = request.get_json() or {}
    if not data.get('name'):
        return jsonify({'error': 'Tag name is required'}), 400

    tag = Tag(name=data['name'])
    db.session.add(tag)
    db.session.commit()

    return jsonify(tag_schema.dump(tag)), 201
