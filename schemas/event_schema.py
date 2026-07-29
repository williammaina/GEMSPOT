from extensions import ma
from models.event import Event, EventBookmark
from marshmallow import fields

class EventSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Event
        load_instance = True
        include_fk = True

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