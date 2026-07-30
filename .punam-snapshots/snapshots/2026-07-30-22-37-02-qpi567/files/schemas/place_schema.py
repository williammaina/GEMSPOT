from extensions import ma
from models.place import Place, PlaceImage
from schemas.category_schema import CategorySchema, TagSchema
from marshmallow import fields, post_dump
from utils.category_map import category_slug


class PlaceImageSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = PlaceImage
        load_instance = True


class PlaceSchema(ma.SQLAlchemyAutoSchema):
    category_obj = fields.Nested(
        CategorySchema,
        attribute="category",
        only=("category_id", "name", "icon", "theme_color"),
        data_key="category_detail",
    )
    tags = fields.Nested(TagSchema, many=True, only=("tag_id", "name"))
    images = fields.Nested(PlaceImageSchema, many=True, only=("image_id", "image_url", "caption"))

    # Frontend-friendly aliases (GemSpot KE polished UI)
    id = fields.Method("get_id")
    title = fields.Method("get_title")
    image = fields.Method("get_image")
    matatu = fields.Method("get_matatu")
    price = fields.Method("get_price")
    location = fields.Method("get_location")
    category = fields.Method("get_category_slug")
    rating = fields.Method("get_rating")
    vibes = fields.Method("get_vibes")
    openNow = fields.Method("get_open_now")
    openLabel = fields.Method("get_open_label")
    hours = fields.Method("get_hours")
    priceLevel = fields.Method("get_price_level")

    class Meta:
        model = Place
        load_instance = True
        include_fk = True

    def get_id(self, obj):
        return obj.place_id

    def get_title(self, obj):
        return obj.name

    def get_image(self, obj):
        return obj.featured_image or ""

    def get_matatu(self, obj):
        return obj.matatu_route or ""

    def get_price(self, obj):
        return obj.damage_for_two

    def get_location(self, obj):
        parts = [p for p in [obj.town, obj.county] if p]
        return ", ".join(parts) if parts else (obj.address or "")

    def get_category_slug(self, obj):
        return category_slug(getattr(obj, "category", None))

    def get_rating(self, obj):
        reviews = getattr(obj, "reviews", None) or []
        if not reviews:
            return 4.5
        vals = [r.rating for r in reviews if getattr(r, "rating", None)]
        if not vals:
            return 4.5
        return round(sum(vals) / len(vals), 1)

    def get_vibes(self, obj):
        tags = getattr(obj, "tags", None) or []
        return [t.name for t in tags if getattr(t, "name", None)]

    def get_open_now(self, obj):
        # Heuristic — frontend also parses opening_hours client-side
        return True

    def get_open_label(self, obj):
        return "Open now" if obj.opening_hours else None

    def get_hours(self, obj):
        return obj.opening_hours

    def get_price_level(self, obj):
        return obj.price_level

    @post_dump
    def keep_raw_fields(self, data, **kwargs):
        # Ensure frontend normalizePlace can always find keys
        data.setdefault("place_id", data.get("id"))
        data.setdefault("name", data.get("title"))
        data.setdefault("featured_image", data.get("image"))
        data.setdefault("matatu_route", data.get("matatu"))
        data.setdefault("damage_for_two", data.get("price"))
        return data


place_schema = PlaceSchema()
places_schema = PlaceSchema(many=True)
