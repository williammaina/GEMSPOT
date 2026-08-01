from extensions import ma
from models.user import User
from marshmallow import fields, post_dump


class UserSchema(ma.SQLAlchemyAutoSchema):
    name = fields.Method("get_name")
    role = fields.Method("get_role")

    class Meta:
        model = User
        load_instance = True
        exclude = ("password_hash",)

    def get_name(self, obj):
        parts = [obj.first_name or "", obj.last_name or ""]
        full = " ".join(p for p in parts if p).strip()
        return full or obj.username

    def get_role(self, obj):
        return "admin" if obj.is_admin else "user"

    @post_dump
    def aliases(self, data, **kwargs):
        data.setdefault("isAdmin", data.get("is_admin"))
        data.setdefault("is_admin", data.get("is_admin"))
        data.setdefault("user_id", data.get("user_id") or data.get("id"))
        return data


user_schema = UserSchema()
users_schema = UserSchema(many=True)
