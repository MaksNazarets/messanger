from main import socketio, db, current_user, app
from flask import request
from flask_socketio import emit
from models import User, Chat, Message


def get_chat_list(user_id):
    with app.app_context():
        chats: list[Chat] = db.session.execute(db.select(Chat).filter(
            (Chat.user1_id == user_id) | (Chat.user2_id == user_id))).scalars().all()

        chat_users = []
        for chat in chats:
            chat_user = chat.user1 if chat.user2_id == user_id else chat.user2
            user_data = {'full_name': f'{chat_user.first_name} {chat_user.last_name}',
                         'user_id': chat_user.id}
            chat_users.append(user_data)

    print(f"Chat users: {chat_users}")
    return chat_users


@socketio.on('connect')
def user_connected():
    with app.app_context():
        user = db.session.execute(db.select(User).where(
            User.id == current_user.id)).scalar()
        # user = current_user
        user.session_id = request.sid
        print(str(user) + ' - ' + user.session_id)
        db.session.commit()

    chat_users = get_chat_list(current_user.id)
    emit('update_chat_list', chat_users, room=current_user.session_id)


@socketio.on('disconnect')
def on_disconnect():
    with app.app_context():
        user = db.session.execute(db.select(User).where(
            User.id == current_user.id)).scalar()
        user.session_id = None
        db.session.commit()
        print(f"User session removed: {current_user.username}")


@socketio.on('chat_data_query')
def send_chat_data(user_id):
    chat: Chat = db.session.execute(db.select(Chat).filter((Chat.user1_id == user_id) | (Chat.user2_id == user_id)).filter(
        (Chat.user1_id == current_user.id) | (Chat.user2_id == current_user.id))).scalar()

    companion = db.session.query(User).filter(User.id == user_id).scalar()

    if chat is None:
        json_msgs = []
    else:
        last_25_msgs: list[Message] = db.session.execute(db.select(Message).where(
            Message.chat_id == chat.id).order_by(Message.timestamp.asc()).limit(25)).scalars().all()

        json_msgs = [m.to_dict() for m in last_25_msgs]

    return_data = {
        'companion': companion.to_dict(),
        'messages': json_msgs
    }

    emit('get_chat_data', return_data, room=current_user.session_id)


@socketio.on('send_message')
def send_message(msg_data):
    print(msg_data)
    chat: Chat = db.session.query(Chat).filter((Chat.user1_id == current_user.id) | (Chat.user2_id == current_user.id)).filter(
        (Chat.user1_id == msg_data['to_user_id']) | (Chat.user2_id == msg_data['to_user_id'])).scalar()

    if chat is None:
        chat = Chat(current_user.id, msg_data['to_user_id'])
        db.session.add(chat)
        db.session.commit()
        user: User = db.session.query(User).filter(User.id==msg_data['to_user_id']).scalar()

        emit('update_chat_list', get_chat_list(current_user))
        if user.session_id:
            emit('update_chat_list', get_chat_list(user.id), room=user.session_id)

    db.session.add(Message(chat.id, current_user.id, msg_data['text']))
    db.session.commit()

    recipient_sid = chat.user1.session_id if chat.user2_id == current_user.id else chat.user2.session_id
    # TODO: Insert into Waiting list if recipient_sid is None

    return_data = msg_data
    return_data['sender_id'] = current_user.id

    emit('new_message', return_data)
    if recipient_sid is not None:
        emit('new_message', return_data, room=recipient_sid)


@socketio.on('search-event')
def get_search_result(search_value):
    with app.app_context():
        users: list[User] = db.session.execute(db.select(User).filter(User.username.ilike(f'{search_value}%')
                            | User.first_name.ilike(f'{search_value}%')
                            | User.last_name.ilike(f'{search_value}%'))
                            .filter(User.id != current_user.id)).scalars().all()

        result_users = []
        for user in users:
            user_data = {'full_name': f'{user.first_name} {user.last_name}',
                         'user_id': user.id}
            result_users.append(user_data)

        emit('search-result', result_users)
