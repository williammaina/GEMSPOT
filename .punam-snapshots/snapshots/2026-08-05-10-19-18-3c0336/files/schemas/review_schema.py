from extensions import ma
from models.review import Review
from schemas.user_schema import UserSchema
from marshmallow import fields


class ReviewSchema(ma.SQLAlchemyAutoSchema):
    user = fields.Nested(
        UserSchema,
        only=("user_id", "username", "first_name", "last_name", "profile_image", "name"),
    )

    class Meta:
        model = Review
        load_instance = True
        include_fk = True


review_schema = ReviewSchema()
reviews_schema = ReviewSchema(many=True)
