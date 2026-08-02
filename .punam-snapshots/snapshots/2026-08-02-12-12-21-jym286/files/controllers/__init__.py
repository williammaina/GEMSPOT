from controllers.auth_controller import auth_bp
from controllers.user_controller import user_bp
from controllers.place_controller import place_bp
from controllers.category_controller import category_bp
from controllers.review_controller import review_bp
from controllers.vibe_check_controller import vibe_bp
from controllers.event_controller import event_bp
from controllers.favorite_controller import favorite_bp
from controllers.admin_controller import admin_bp

__all__ = [
    'auth_bp',
    'user_bp',
    'place_bp',
    'category_bp',
    'review_bp',
    'vibe_bp',
    'event_bp',
    'favorite_bp',
    'admin_bp',
]
