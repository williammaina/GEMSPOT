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
    host = fields.Method("get_host")
    goingCount = fields.Method("get_going")
    attendees = fields.Method("get_going")

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
        # Frontend sometimes wants numeric; provide both via aliases
        return f"KES {int(obj.ticket_price):,}"

    def get_start(self, obj):
        return obj.start_date.isoformat() if obj.start_date else None

    def get_end(self, obj):
        return obj.end_date.isoformat() if obj.end_date else None

    def get_category(self, obj):
        cat = getattr(obj, "category", None)
        if cat is not None:
            return category_slug(cat)
        # fallback to first tag
        tags = obj.tags or []
        if tags:
            return tags[0]
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

    def get_host(self, obj):
        if obj.host_name or obj.host_org:
            return {"name": obj.host_name or "", "org": obj.host_org or ""}
        return obj.venue_name or "GemSpot host"

    def get_going(self, obj):
        return obj.going_count or 0

    @post_dump
    def aliases(self, data, **kwargs):
        data.setdefault("event_id", data.get("id"))
        data.setdefault("banner", data.get("image"))
        data.setdefault("venue_name", data.get("location"))
        data.setdefault("start_date", data.get("startDate"))
        data.setdefault("end_date", data.get("endDate"))
        data.setdefault("ticket_price", data.get("ticket_price"))
        data.setdefault("tags", data.get("tags") or [])
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
