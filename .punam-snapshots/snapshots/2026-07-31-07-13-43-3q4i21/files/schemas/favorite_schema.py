from extensions import ma
from models.favorite import Favorite
from schemas.place_schema import PlaceSchema
from marshmallow import fields

class FavoriteSchema(ma.SQLAlchemyAutoSchema):
    place = fields.Nested(PlaceSchema)

    class Meta:
        model = Favorite
        load_instance = True
        include_fk = True

favorite_schema = FavoriteSchema()
favorites_schema = FavoriteSchema(many=True)