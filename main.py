from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_socketio import SocketIO
from flask_migrate import Migrate

app = Flask(__name__)

# app.config.from_object(os.environ['APP_SETTINGS'])
app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql://postgres:admin@localhost:5433/MyMessanger"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024 #5MB
app.secret_key = 'some_secret_key!'

socketio = SocketIO(app, max_http_buffer_size=5 * 1024 * 1024)
print(socketio.async_mode)

login_manager = LoginManager()

db = SQLAlchemy(app)
migrate = Migrate(app, db)
