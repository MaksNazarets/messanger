from main import socketio, db, app
from flask import request
from flask_login import current_user
from flask_socketio import emit
from models import User, Chat, Message
from sqlalchemy.sql.expression import func

def get_chat_list(user_id, dict_view=True):
    with app.app_context():
        chats: list[Chat] = db.session.execute(db.select(Chat).filter(
            (Chat.user1_id == user_id) | (Chat.user2_id == user_id))).scalars().all()
        
        chat_users = []
        for chat in chats:
            chat_user = chat.user1 if chat.user2_id == user_id else chat.user2
            
            if dict_view:
                user_data = chat_user.to_dict()

                user_data['unread_count'] = db.session.query(func.count(Message.id))\
                    .filter(Message.chat_id == chat.id,
                            Message.sender_id != user_id, 
                            Message.read_by_recipient == False).scalar()
            
                chat_users.append(user_data)
            else:
                chat_users.append(chat_user)

    print(f"Chat users: {chat_users}")
    return chat_users


@socketio.on('connect')
def user_connected():
    with app.app_context():
        user = db.session.execute(db.select(User).where(
            User.id == current_user.id)).scalar()
        
        user.session_id = request.sid
        print(str(user) + ' - ' + user.session_id)
        db.session.commit()

    chat_users_dict = get_chat_list(current_user.id)
    emit('update_chat_list', chat_users_dict, room=current_user.session_id)

    chat_users = get_chat_list(current_user.id, dict_view=False)
    for user in chat_users:
        if user.session_id:
            emit('user-online-status-update', current_user.to_dict(), room=user.session_id)


@socketio.on('disconnect')
def on_disconnect():
    with app.app_context():
        user = db.session.execute(db.select(User).where(
            User.id == current_user.id)).scalar()
        user.session_id = None
        db.session.commit()
        print(f"User session removed: {current_user.username}")

    chat_users = get_chat_list(current_user.id, dict_view=False)
    for user in chat_users:
        if user.session_id:
            emit('user-online-status-update', current_user.to_dict(), room=user.session_id)


@socketio.on('chat_data_query')
def send_chat_data(user_id):
    chat: Chat = db.session.execute(db.select(Chat).filter((Chat.user1_id == user_id) | (Chat.user2_id == user_id)).filter(
        (Chat.user1_id == current_user.id) | (Chat.user2_id == current_user.id))).scalar()

    companion = db.session.query(User).filter(User.id == user_id).scalar()

    if chat is None:
        json_msgs = []
    else:
        last_25_msgs: list[Message] = db.session.execute(db.select(Message).where(
            Message.chat_id == chat.id).order_by(Message.timestamp.desc()).limit(25)).scalars().all()

        json_msgs = [m.to_dict() for m in last_25_msgs]
        
    return_data = {
        'companion': companion.to_dict(),
        'messages': json_msgs
    }

    emit('get_chat_data', return_data, room=current_user.session_id)


@socketio.on('send_message')
def send_message(msg_data):
    # print(msg_data)
    chat: Chat = db.session.query(Chat).filter((Chat.user1_id == current_user.id) | (Chat.user2_id == current_user.id)).filter(
        (Chat.user1_id == msg_data['to_user_id']) | (Chat.user2_id == msg_data['to_user_id'])).scalar()

    if chat is None:
        chat = Chat(current_user.id, msg_data['to_user_id'])
        db.session.add(chat)
        db.session.commit()
        user: User = db.session.query(User).filter(User.id==msg_data['to_user_id']).scalar()

        emit('update_chat_list', get_chat_list(current_user.id))
        if user.session_id:
            emit('update_chat_list', get_chat_list(user.id), room=user.session_id)

    msg = Message(chat.id, current_user.id, msg_data['text'])
    db.session.add(msg)
    db.session.commit()

    recipient_sid = chat.user1.session_id if chat.user2_id == current_user.id else chat.user2.session_id
    # TODO: Insert into Waiting list if recipient_sid is None

    return_data = msg_data
    return_data['my-msg'] = True

    emit('new_message', return_data)
    if recipient_sid is not None:
        emit('new_message', msg.to_dict(), room=recipient_sid)


@socketio.on('search-event')
def get_search_result(search_value):
    with app.app_context():
        users: list[User] = db.session.execute(db.select(User).filter(User.username.ilike(f'{search_value}%')
                            | User.first_name.ilike(f'{search_value}%')
                            | User.last_name.ilike(f'{search_value}%'))
                            .filter(User.id != current_user.id)).scalars().all()

        result_users = []
        for user in users:
            user_data = user.to_dict()
            result_users.append(user_data)

        emit('search-result', result_users)


@socketio.on('mark-msgs-as-read')
def set_msgs_as_read(msg_ids):
    msgs:list[Message] = db.session.query(Message).filter(Message.id.in_(msg_ids)).all()
   
    for m in msgs:
        m.read_by_recipient = True

    db.session.commit()


@socketio.on('load-more-messages')
def load_more_messages(params):
    comp_id = params['companion-id']
    chat = db.session.query(Chat).filter((Chat.user1_id==comp_id) | (Chat.user2_id==comp_id))\
        .filter((Chat.user1_id==current_user.id) | (Chat.user2_id==current_user.id)).scalar()
    
    msgs_to_return = db.session.query(Message).filter(Message.chat_id==chat.id, Message.id < params['start-message-id']).order_by(Message.timestamp.desc()).limit(25).all()
    
    msgs_to_return = [m.to_dict() for m in msgs_to_return]
    print(msgs_to_return)
    emit('more-chat-messeges-response', msgs_to_return)
    
