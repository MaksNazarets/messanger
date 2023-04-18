from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_socketio import SocketIO
from flask_migrate import Migrate
import os

app = Flask(__name__)

# app.config.from_object(os.environ['APP_SETTINGS'])
app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql://postgres:admin@localhost:5433/MyMessanger"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = 'some_secret_key!'

socketio = SocketIO(app)
print(socketio.async_mode)

login_manager = LoginManager()

db = SQLAlchemy(app)
migrate = Migrate(app, db)
