from extensions import db

class Category(db.Model):
    __tablename__ = 'categories'

    category_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    icon = db.Column(db.String(100), nullable=True)
    description = db.Column(db.Text, nullable=True)

class Tag(db.Model):
    __tablename__ = 'tags'

    tag_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)