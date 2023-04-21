from socket_server import *
from views import *
from main import app, socketio, login_manager
from auth import *
from query_handling import *
from models import User, Attachment, Chat, Message, Notification

with app.app_context():
    db.create_all()

login_manager.init_app(app)


if __name__ == '__main__':
    socketio.run(app, debug=True)
