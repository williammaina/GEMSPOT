from extensions import db

place_tags = db.Table(
    'place_tags',
    db.Column('place_id', db.Integer, db.ForeignKey('places.place_id', ondelete='CASCADE'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tags.tag_id', ondelete='CASCADE'), primary_key=True)
)