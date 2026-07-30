from extensions import ma
from models.place import Place, PlaceImage
from schemas.category_schema import CategorySchema, TagSchema
from marshmallow import fields

class PlaceImageSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = PlaceImage
        load_instance = True

class PlaceSchema(ma.SQLAlchemyAutoSchema):
    category = fields.Nested(CategorySchema, only=("category_id", "name", "icon", "theme_color"))
    tags = fields.Nested(TagSchema, many=True, only=("tag_id", "name"))
    images = fields.Nested(PlaceImageSchema, many=True, only=("image_id", "image_url", "caption"))

    class Meta:
        model = Place
        load_instance = True
        include_fk = True

place_schema = PlaceSchema()
places_schema = PlaceSchema(many=True)