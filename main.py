from flask import Flask, render_template
from flask_login import LoginManager
from flask_migrate import Migrate
from config import Config
from extensions import db
from models import User
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Ensure the DATABASE_URL is set
    if 'DATABASE_URL' not in os.environ:
        raise ValueError("DATABASE_URL environment variable is not set")

    # Set the SQLALCHEMY_DATABASE_URI from the environment variable
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']

    db.init_app(app)
    migrate = Migrate(app, db)
    
    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    from auth import auth as auth_blueprint
    from dashboard import dashboard as dashboard_blueprint
    from public import public as public_blueprint

    app.register_blueprint(auth_blueprint)
    app.register_blueprint(dashboard_blueprint)
    app.register_blueprint(public_blueprint)

    @app.route('/')
    def index():
        return render_template('index.html')

    return app

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000)
