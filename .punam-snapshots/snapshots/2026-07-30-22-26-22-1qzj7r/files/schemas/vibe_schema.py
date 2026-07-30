from extensions import ma
from models.vibe_check import VibeCheck
from schemas.user_schema import UserSchema
from marshmallow import fields

class VibeCheckSchema(ma.SQLAlchemyAutoSchema):
    user = fields.Nested(UserSchema, only=("user_id", "username", "first_name", "last_name", "profile_image"))

    class Meta:
        model = VibeCheck
        load_instance = True
        include_fk = True

vibe_schema = VibeCheckSchema()
vibes_schema = VibeCheckSchema(many=True)