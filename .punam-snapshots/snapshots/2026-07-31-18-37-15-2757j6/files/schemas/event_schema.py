from extensions import ma
from models.event import Event, EventBookmark
from marshmallow import fields, post_dump
from utils.category_map import category_slug


class EventSchema(ma.SQLAlchemyAutoSchema):
    id = fields.Method("get_id")
    image = fields.Method("get_image")
    location = fields.Method("get_location")
    price = fields.Method("get_price")
    startDate = fields.Method("get_start")
    endDate = fields.Method("get_end")
    category = fields.Method("get_category")
    day = fields.Method("get_day")
    month = fields.Method("get_month")
    weekday = fields.Method("get_weekday")
    time = fields.Method("get_time")

    class Meta:
        model = Event
        load_instance = True
        include_fk = True

    def get_id(self, obj):
        return obj.event_id

    def get_image(self, obj):
        return obj.banner or ""

    def get_location(self, obj):
        return obj.venue_name or ""

    def get_price(self, obj):
        if obj.ticket_price in (0, None):
            return "Free Entry"
        return f"KES {int(obj.ticket_price):,}"

    def get_start(self, obj):
        return obj.start_date.isoformat() if obj.start_date else None

    def get_end(self, obj):
        return obj.end_date.isoformat() if obj.end_date else None

    def get_category(self, obj):
        cat = getattr(obj, "category", None)
        if cat is not None:
            return category_slug(cat)
        return ""

    def _dt(self, obj):
        return obj.start_date

    def get_day(self, obj):
        dt = self._dt(obj)
        return f"{dt.day:02d}" if dt else None

    def get_month(self, obj):
        dt = self._dt(obj)
        return dt.strftime("%b").upper() if dt else None

    def get_weekday(self, obj):
        dt = self._dt(obj)
        return dt.strftime("%a").upper() if dt else None

    def get_time(self, obj):
        dt = self._dt(obj)
        return dt.strftime("%I:%M %p").lstrip("0") if dt else None

    @post_dump
    def aliases(self, data, **kwargs):
        data.setdefault("event_id", data.get("id"))
        data.setdefault("banner", data.get("image"))
        data.setdefault("venue_name", data.get("location"))
        data.setdefault("start_date", data.get("startDate"))
        data.setdefault("end_date", data.get("endDate"))
        data.setdefault("ticket_price", data.get("ticket_price"))
        return data


class EventBookmarkSchema(ma.SQLAlchemyAutoSchema):
    event = fields.Nested(EventSchema)

    class Meta:
        model = EventBookmark
        load_instance = True
        include_fk = True


event_schema = EventSchema()
events_schema = EventSchema(many=True)
event_bookmark_schema = EventBookmarkSchema()
event_bookmarks_schema = EventBookmarkSchema(many=True)
