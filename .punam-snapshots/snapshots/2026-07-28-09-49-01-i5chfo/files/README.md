🇰🇪 GemSpot KE API — Flask, SQLAlchemy ORM, Migrations, Serialization & AuthWelcome to the backend repository for GemSpot KE! This project is a production-ready, discovery-first REST API powering urban lifestyle, real-time crowd tracking ("Vibe Checks"), localized logistics search, and event planning across major Kenyan cities (Nairobi, Mombasa, Kisumu, Nakuru).Read this document top to bottom before contributing — it explains not just how to set up the API, but why each layer of our Model-View-Controller (MVC) architecture exists.🏛️ New to how this project is organized? Read the companion guide MVC.md — it details the separation of concerns and pattern rules governing every folder in this repository.🗂 Table of ContentsWhat This Project IsTech StackProject StructureCore Concepts & Architecture ExplainedWhat is an ORM?Flask-SQLAlchemy & LocalizationWhy extensions.py Exists (Avoiding Circular Imports)Models — Your Schema as Python ClassesMigrations — Version Control for Your DatabaseThe Controller Layer — Separation of ConcernsSerialization — Objects to JSON with MarshmallowAuthentication & Security — Passwords & JWTGetting Started (Setup)The Migration WorkflowCore REST API EndpointsFrontend Integration Guidelines (React 19 + Vite)Command Cheat SheetTroubleshooting🎯 What This Project IsGeneric navigation apps tell you where a venue is located, but fail to answer localized, practical questions before you leave home:Does this venue accept M-Pesa?Is secure parking available on-site?What is the average "damage for two" (realistic spending for a pair)?Is the venue packed, quiet, or rainy right now?GemSpot KE solves this by providing structured metadata, real-time crowdsourced "Vibe Checks," budget filters, and calendar-linked event tracking tailored to Kenyan urbanites and travelers.🧰 Tech StackLayerTechnologyPurposeBackend FrameworkFlask 3Lightweight REST API framework — routes, requests, responsesORMFlask-SQLAlchemyDatabase interactions using Python object modelsDatabase MigrationsFlask-Migrate (Alembic)Version-control system for database schema changesSerializationFlask-MarshmallowConverts SQLAlchemy models into validated JSON representationsAuthenticationFlask-JWT-ExtendedIssues and validates JWT access tokensPassword HashingWerkzeug SecuritySecure one-way password hashing (scrypt / pbkdf2)DatabaseSQLite (Dev) / PostgreSQL (Prod)File-based local storage or scalable production relational databaseCORSFlask-CORSCross-Origin Resource Sharing for React client communication📁 Project StructurePlaintext.
├── controllers/                  # CONTROLLER LAYER: Business logic & DB queries
│   ├── __init__.py
│   ├── admin_controller.py       # Content moderation & listing verification
│   ├── auth_controller.py        # Registration, login, identity endpoints
│   ├── category_controller.py    # Place categories & tags handling
│   ├── event_controller.py       # Event discovery & bookmark operations
│   ├── favorite_controller.py     # Bookmark / saved place management
│   ├── place_controller.py        # Search, budget/vibe filters & geolocation
│   ├── review_controller.py       # Ratings, text reviews & media updates
│   ├── user_controller.py        # Profile updates & avatar management
│   └── vibe_check_controller.py   # Real-time crowd & weather updates
├── migrations/                   # Auto-generated Alembic database migration scripts
│   ├── env.py
│   ├── alembic.ini
│   └── versions/                 # Revision history files
├── models/                       # MODEL LAYER: SQLAlchemy tables & entity logic
│   ├── __init__.py
│   ├── category.py               # Categories & Tags models
│   ├── event.py                  # Events & EventBookmarks models
│   ├── favorite.py               # User Favorites junction model
│   ├── place.py                  # Places & PlaceImages models
│   ├── place_tag.py              # Many-to-Many association table (Place <-> Tag)
│   ├── review.py                 # Place Reviews model
│   ├── user.py                   # User account & password hash logic
│   └── vibe_check.py             # Live crowd level & weather reports model
├── schemas/                      # SERIALIZATION LAYER: Marshmallow Schemas
│   ├── __init__.py
│   ├── category_schema.py
│   ├── event_schema.py
│   ├── place_schema.py
│   ├── review_schema.py
│   ├── user_schema.py
│   └── vibe_schema.py
├── .gitignore                    # Excludes venv, secrets, instance DBs
├── extensions.py                 # Singleton extension declarations (db, ma, jwt, cors)
├── main.py                       # Application factory, Blueprint registration & entry point
├── MVC.md                        # Architecture & code organization guide
├── README.md                     # System documentation
└── requirements.txt              # Dependency management
🏗️ Architectural Flow: A request enters through main.py (Route Blueprint) → passes to controllers/ (Business Logic) → reads/writes via models/ (Database Entity) → formats output through schemas/ (Serialization) → sends back JSON response to the client.🧠 Core Concepts & Architecture Explained1. What is an ORM?An ORM (Object-Relational Mapper) translates database rows into native Python objects:Python Class / ObjectRelational DatabaseClass (Place)Table (places)Attribute (name)Column (name)Instance (Place(name="Alchemist"))Row in tableWithout an ORM, hand-written SQL queries introduce risks of SQL injection and typos. With SQLAlchemy:Python# Create a new venue entry
new_place = Place(name="Bao Box", price_level="KES 1,500-3,000", mpesa_available=True)
db.session.add(new_place)
db.session.commit()
2. Flask-SQLAlchemy & LocalizationSQLAlchemy abstracts database configuration. In main.py:Pythonapp.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///instance/gemspot.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
Localization metadata attributes are stored natively in the places schema:damage_for_two: Integer estimate of spending for two guests (e.g., 3500).mpesa_available: Boolean indicator (True/False).parking: Enum/String indicator ("Secure On-Site", "Street Parking", "Valet").3. Why extensions.py Exists (Avoiding Circular Imports)To prevent circular dependencies between models and application routes, shared extension objects are initialized empty inside extensions.py:Pythonfrom flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db = SQLAlchemy()
ma = Marshmallow()
jwt = JWTManager()
cors = CORS()
main.py binds these extensions to the app instance using init_app(app).4. Models — Your Schema as Python ClassesExample from models/place.py:Pythonfrom extensions import db

class Place(db.Model):
    __tablename__ = "places"

    place_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    damage_for_two = db.Column(db.Integer, nullable=True)
    mpesa_available = db.Column(db.Boolean, default=True)
    parking = db.Column(db.Boolean, default=True)
    verified = db.Column(db.Boolean, default=False)

    # Relationships
    vibe_checks = db.relationship("VibeCheck", backref="place", lazy=True)
    reviews = db.relationship("Review", backref="place", lazy=True)
5. Migrations — Version Control for Your DatabaseDatabase migrations track changes to model structures over time. Flask-Migrate (powered by Alembic) compares your Python classes against the current database schema and creates executable python scripts in migrations/versions/.PlaintextModel Change ---> `flask db migrate` (Generate Script) ---> `flask db upgrade` (Apply to DB)
6. The Controller Layer — Separation of ConcernsControllers contain business rules and database queries so routes remain small and declarative.Example from controllers/place_controller.py:Pythonfrom models.place import Place

class PlaceController:
    @classmethod
    def filter_places(cls, category_id=None, max_budget=None, mpesa_only=False):
        query = Place.query
        if category_id:
            query = query.filter(Place.category_id == category_id)
        if max_budget:
            query = query.filter(Place.damage_for_two <= max_budget)
        if mpesa_only:
            query = query.filter(Place.mpesa_available == True)
        return query.all()
7. Serialization — Objects to JSON with MarshmallowFlask cannot return raw SQLAlchemy objects as JSON directly. Marshmallow converts Python class instances to dictionaries and validates incoming JSON payloads.Example from schemas/place_schema.py:Pythonfrom extensions import ma
from models.place import Place

class PlaceSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Place
        load_instance = True

place_schema = PlaceSchema()
places_schema = PlaceSchema(many=True)
8. Authentication & Security — Passwords & JWTPassword Hashing (models/user.py)Plaintext passwords are never saved. Passwords are hashed before storage:Pythonfrom werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    password_hash = db.Column(db.String(256), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
JSON Web Tokens (JWT)Upon login, the server issues a signed JWT. Subsequent requests pass this token in the header:HTTPAuthorization: Bearer <your_access_token>
Routes protected with @jwt_required() verify this token automatically:Python@place_bp.route('/<int:place_id>/vibe-check', methods=['POST'])
@jwt_required()
def submit_vibe_check(place_id):
    current_user_id = get_jwt_identity()
    # Process crowdsourced vibe check update...
🚀 Getting Started (Setup)1. Clone & Setup Virtual EnvironmentBashgit clone https://github.com/your-org/gemspot-backend.git
cd gemspot-backend

# Create virtual environment
python3 -m venv venv

# Activate environment
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows
2. Install DependenciesBashpip install -r requirements.txt
3. Configure Environment VariablesCreate a .env file in the root folder:Code snippetFLASK_APP=main.py
FLASK_ENV=development
SECRET_KEY=dev_secret_key_change_in_production
JWT_SECRET_KEY=jwt_secret_key_change_in_production
DATABASE_URL=sqlite:///instance/gemspot.db
4. Initialize Database & Run MigrationsBashexport FLASK_APP=main.py
flask db upgrade
5. Run the API ServerBashpython main.py
The API will start running at [http://127.0.0.1:5000/](http://127.0.0.1:5000/).🔄 The Migration WorkflowRepeat this three-step workflow whenever model schema definitions change:Bash# 1. Update Python models in models/ folder
# 2. Generate a new migration script
flask db migrate -m "add verified_status to places"

# 3. Apply changes to the target database
flask db upgrade
⚠️ Note: Always review generated migration files inside migrations/versions/ before applying them with flask db upgrade.🚀 Core REST API EndpointsAll routes are versioned under /api/v1.Auth Endpoints (/api/v1/auth)POST /register — Register new user account.POST /login — Authenticate user and return JWT access token.GET /me — Get current authenticated user details (Requires JWT).Place & Discovery Endpoints (/api/v1/places)GET / — Search/filter places (Params: category, max_budget, mpesa_only, vibe).GET /<int:place_id> — Fetch detailed venue profile & logistics metadata.POST / — Add a new venue listing (Admin/Business host).Vibe Checks (/api/v1/vibes)GET /<int:place_id> — Fetch current real-time crowd level (Packed, Moderate, Quiet) and weather status.POST /<int:place_id> — Submit crowdsourced live update (Requires JWT).Events (/api/v1/events)GET / — Retrieve upcoming local events and ticketing links.POST /<int:event_id>/bookmark — Bookmark an event to user calendar (Requires JWT).🔗 Frontend Integration Guidelines (React 19 + Vite)Authorization Headers: Attach JWT tokens to outgoing Axios or Fetch requests:JavaScriptheaders: {
  Authorization: `Bearer ${token}`
}
CORS Support: CORS is configured to allow requests from local frontend servers (http://localhost:5173 or http://localhost:3000).Array Null-Safety: API response fields returning list collections (e.g., images, reviews, tags) default to empty arrays [] rather than null to avoid rendering crashes.🛠 Command Cheat SheetActionCommandActivate virtual environmentsource venv/bin/activateInstall dependenciespip install -r requirements.txtRun development serverpython main.pyGenerate database migrationflask db migrate -m "description"Apply database migrationflask db upgradeRollback last migrationflask db downgradeLaunch Flask Shellflask shell❓ Troubleshooting1. ModuleNotFoundError on server startEnsure your virtual environment is active ((venv) should appear in terminal prompt) and run pip install -r requirements.txt.2. JWT Header missing / 401 UnauthorizedVerify that the frontend request includes the exact string format Bearer <token> in the HTTP Authorization header.3. Database lock / migration conflictIf migration histories diverge during team development, run flask db history to inspect conflicting migration heads, or reset local development databases in non-production environments by deleting instance/gemspot.db and running flask db upgrade.