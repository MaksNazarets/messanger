from main import db
from flask_login import UserMixin
from datetime import datetime

class User(db.Model, UserMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False, unique=True)
    email = db.Column(db.String(50), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(50), nullable=True)
    last_name = db.Column(db.String(50), nullable=True)
    session_id = db.Column(db.String(50), nullable=True, unique=True)

    def __init__(self, first_name, last_name, username, email, password):
        self.first_name = first_name
        self.last_name = last_name
        self.username = username
        self.email = email
        self.password = password

    def __repr__(self):
        return 'User - id: {}'.format(self.id)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'is_online': self.session_id is not None
        }

class Chat(db.Model):
    __tablename__ = 'chat'

    id = db.Column(db.Integer, primary_key=True)
    user1_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user2_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, )

    user1 = db.relationship('User', foreign_keys=[user1_id])
    user2 = db.relationship('User', foreign_keys=[user2_id])

    def __init__(self, user1_id, user2_id):
        self.user1_id = user1_id
        self.user2_id = user2_id

    def __repr__(self):
        return f'<Chat {self.user1.username} and {self.user2.username}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user1_id': self.user1_id,
            'user2_id': self.user2_id,
            'timestamp': self.timestamp.isoformat()
        }


class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.Integer, db.ForeignKey(
        'chat.id'), nullable=False)
    sender_id = db.Column(
        db.Integer, db.ForeignKey('users.id'), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    text = db.Column(db.Text, nullable=False)
    read_by_recipient = db.Column(db.Boolean, default=False)

    conversation = db.relationship('Chat')
    sender = db.relationship('User')

    def __init__(self, chat_id, sender_id, text):
        self.chat_id = chat_id
        self.sender_id = sender_id
        self.text = text

    def __repr__(self):
        return f'<Message {self.sender.username}: {self.text}>'

    def to_dict(self):
        return {
            'id': self.id,
            'chat_id': self.chat_id,
            'sender_id': self.sender_id,
            'timestamp': self.timestamp.isoformat(),
            'text': self.text,
            'read_by_recipient': self.read_by_recipient
        }

class Attachment(db.Model):
    __tablename__ = 'attachment'

    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.Integer, db.ForeignKey(
        'messages.id'), nullable=False)
    attachment_type = db.Column(db.String(50), nullable=False)
    meta = db.Column(db.JSON, nullable=False)

    message = db.relationship('Message')

    def __init__(self, message_id, attachment_type, metadata):
        self.message_id = message_id
        self.attachment_type = attachment_type
        self.metadata = metadata

    def __repr__(self):
        return f'<Attachment {self.attachment_type}>'


class Notification(db.Model):
    __tablename__ = 'notification'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey(
        'users.id'), nullable=False)
    message_id = db.Column(db.Integer, db.ForeignKey(
        'messages.id'), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow())

    user = db.relationship('User')
    message = db.relationship('Message')

    def __init__(self, user_id, message_id):
        self.user_id = user_id
        self.message_id = message_id

    def __repr__(self):
        return f'<Notification {self.user.username}: {self.message.text}>'

