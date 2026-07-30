import os
from flask import Flask, jsonify
from extensions import db, ma, jwt, cors, migrate

# Import models so Flask-Migrate detects schema metadata
import models

# Import controller blueprints
from controllers import (
    auth_bp,
    user_bp,
    place_bp,
    category_bp,
    review_bp,
    vibe_bp,
    event_bp,
    favorite_bp,
    admin_bp
)


def create_app():
    app = Flask(__name__)

    # ------------------------------------------------------------------
    # Environment & Database Configuration
    # ------------------------------------------------------------------
    database_url = os.environ.get('DATABASE_URL', 'sqlite:///gemspot.db')
    # Convert legacy 'postgres://' URIs (used by Render/Heroku) to 'postgresql://'
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'gemspot_ke_secret_key_2026')
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'gemspot_ke_jwt_secret_2026')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # ------------------------------------------------------------------
    # Initialize Extensions
    # ------------------------------------------------------------------
    db.init_app(app)
    ma.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)
    migrate.init_app(app, db)

    # ------------------------------------------------------------------
    # Register Blueprints
    # ------------------------------------------------------------------
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(place_bp)
    app.register_blueprint(category_bp)
    app.register_blueprint(review_bp)
    app.register_blueprint(vibe_bp)
    app.register_blueprint(event_bp)
    app.register_blueprint(favorite_bp)
    app.register_blueprint(admin_bp)

    # ------------------------------------------------------------------
    # Custom CLI Commands
    # ------------------------------------------------------------------
    @app.cli.command("seed")
    def seed_db():
        """Seed initial data into the database."""
        try:
            from seed import seed_data
            seed_data()
        except ImportError:
            # Fallback if seed.py executes on import or uses a different function name
            import seed
            if hasattr(seed, "seed_data"):
                seed.seed_data()
            elif hasattr(seed, "seed"):
                seed.seed()
            elif hasattr(seed, "run"):
                seed.run()
        print("Database seeding process completed!")

    # ------------------------------------------------------------------
    # Custom JWT Error Responses
    # ------------------------------------------------------------------
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            'error': 'Authorization token is missing',
            'code': 'authorization_required'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            'error': 'Provided token is invalid or corrupted',
            'code': 'invalid_token'
        }), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            'error': 'Token has expired. Please log in again.',
            'code': 'token_expired'
        }), 401

    # ------------------------------------------------------------------
    # Global HTTP Error Handlers
    # ------------------------------------------------------------------
    @app.errorhandler(404)
    def handle_404(error):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def handle_500(error):
        return jsonify({'error': 'An internal server error occurred'}), 500

    # ------------------------------------------------------------------
    # API Health & Index Route
    # ------------------------------------------------------------------
    @app.route('/')
    def index():
        return jsonify({
            'platform': 'GemSpot KE REST API',
            'status': 'online',
            'version': '1.0.0',
            'endpoints': {
                'auth': '/api/auth',
                'users': '/api/users',
                'places': '/api/places',
                'categories': '/api/categories',
                'reviews': '/api/reviews',
                'vibes': '/api/vibes',
                'events': '/api/events',
                'favorites': '/api/favorites',
                'admin': '/api/admin'
            }
        }), 200

    return app


app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)