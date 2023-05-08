import os
from main import socketio, db, app
from flask import request, jsonify
from flask_login import current_user
from flask_socketio import emit
from models import User, Chat, Message, Attachment
from sqlalchemy.sql.expression import func
from sqlalchemy import and_
from werkzeug.utils import secure_filename
import json


def get_chat(user1_id, user2_id):
    chat: Chat = db.session.execute(db.select(Chat).filter(
        and_(Chat.user1_id == user1_id, Chat.user2_id == user2_id)
        | and_(Chat.user1_id == user2_id, Chat.user2_id == user1_id))).scalar()

    return chat


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

    # print(f"Chat users: {chat_users}")
    return chat_users


@socketio.on('connect')
def user_connected():
    with app.app_context():
        user = db.session.execute(db.select(User).where(
            User.id == current_user.id)).scalar()

        user.session_id = request.sid
        db.session.commit()

    chat_users_dict = get_chat_list(current_user.id)
    emit('update_chat_list', chat_users_dict, room=current_user.session_id)

    chat_users = get_chat_list(current_user.id, dict_view=False)
    for user in chat_users:
        if user.session_id:
            emit('user-online-status-update',
                 current_user.to_dict(), room=user.session_id)


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
            emit('user-online-status-update',
                 current_user.to_dict(), room=user.session_id)


@socketio.on('chat_data_query')
def send_chat_data(user_id):
    companion = db.session.query(User).filter(User.id == user_id).scalar()

    chat: Chat = db.session.execute(db.select(Chat).filter((Chat.user1_id == user_id) | (Chat.user2_id == user_id)).filter(
        (Chat.user1_id == current_user.id) | (Chat.user2_id == current_user.id))).scalar()

    if chat is None:
        json_msgs = []
    else:
        last_25_msgs: list[Message] = db.session.execute(db.select(Message).where(
            Message.chat_id == chat.id).order_by(Message.timestamp.desc()).limit(25)).scalars().all()

        attachments: list[Attachment] = db.session.query(Attachment)\
            .filter(
            Attachment.message_id > last_25_msgs[-1].id,
            Attachment.message_id <= last_25_msgs[0].id
        ).all()
        json_msgs = [m.to_dict() for m in last_25_msgs]
        for m in json_msgs:
            if m['id'] in [a.message_id for a in attachments]:
                m['attachments'] = [{'name': f.meta["name"], 'file_number': f.meta['file_number'],
                                     'size': f.meta['size'], 'type': f.attachment_type} for f in attachments if f.message_id == m['id']]

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
        user: User = db.session.query(User).filter(
            User.id == msg_data['to_user_id']).scalar()

        emit('update_chat_list', get_chat_list(current_user.id))
        if user.session_id:
            emit('update_chat_list', get_chat_list(
                user.id), room=user.session_id)

    msg = Message(chat.id, current_user.id, msg_data['text'])
    db.session.add(msg)
    db.session.commit()

    recipient_sid = chat.user1.session_id if chat.user2_id == current_user.id else chat.user2.session_id
    # TODO: Insert into Waiting list if recipient_sid is None

    return_data = msg.to_dict()
    return_data['my-msg'] = True

    emit('new-message', return_data)
    if recipient_sid is not None:
        emit('new-message', msg.to_dict(), room=recipient_sid)


img_extensions = ['jpg', 'png', 'webp', 'gif',
                  'jpg', 'jpeg', 'jfif', 'pjpeg', 'pjp', 'svg']
video_extensions = ['webm', 'mkv', 'flv', 'vob', 'ogg', 'ogv', 'gifv', 'mng', 'avi', 'mov', 'wmv',
                    'yuv', 'mp4', 'm4p', 'm4v', 'mpg', 'mp2', 'mpeg', 'mpe', 'mpv', 'flv', 'f4v', 'f4p', 'f4a', 'f4b']


@socketio.on('send_message-with-attachments')
def send_message_with_attachments(msg_data, attachments):
    if not current_user.has_premium:
        return

    chat = get_chat(current_user.id, msg_data['to_user_id'])

    if chat is None:
        chat = Chat(current_user.id, msg_data['to_user_id'])
        db.session.add(chat)
        db.session.commit()
        user: User = db.session.query(User).filter(
            User.id == msg_data['to_user_id']).scalar()

        emit('update_chat_list', get_chat_list(current_user.id))
        if user.session_id:
            emit('update_chat_list', get_chat_list(
                user.id), room=user.session_id)

    msg = Message(chat.id, current_user.id, msg_data['title'])
    db.session.add(msg)
    try:
        db.session.commit()
    except Exception as e:
        print(e)
        return

    print('msg id:', msg.id)

    dir_path = os.path.join(app.root_path, 'user_data',
                            'attachments', f"msg_{msg.id}")
    os.makedirs(dir_path)

    atts = []

    i = 1
    for file in attachments:
        filename = file['name']

        with open(os.path.join(dir_path, filename), 'wb') as f:
            f.write(file['data'])
        print(f'Saved {filename} to disk.')

        type = 'file'
        extension = f"{file['name'].rsplit('.', 1)[1].lower()}"

        if extension in img_extensions:
            type = 'image'
        elif extension in video_extensions:
            type = 'video'

        att = Attachment(msg.id, type, {'name': str(
            file['name']), 'file_number': i, 'size': file['size']})
        db.session.add(att)
        atts.append(att)
        i += 1

    try:
        db.session.commit()

        msg_dict = msg.to_dict()
        msg_dict['attachments'] = [{'name': f.meta["name"], 'file_number': f.meta['file_number'],
                                    'size': f.meta['size'], 'type': f.attachment_type} for f in atts]

        recipient_sid = chat.user1.session_id if chat.user2_id == current_user.id else chat.user2.session_id
        return_data = msg_dict

        return_data['my-msg'] = True
        emit('new-message', return_data)

        if recipient_sid:
            emit('new-message', msg_dict, room=recipient_sid)

    except Exception as e:
        print(e)


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

            chat = get_chat(user.id, current_user.id)

            if chat is None:
                user_data['unread_count'] = 0
            else:
                user_data['unread_count'] = db.session.query(func.count(Message.id))\
                    .filter(Message.chat_id == chat.id,
                            Message.sender_id == user.id,
                            Message.read_by_recipient == False).scalar()

            result_users.append(user_data)

        emit('search-result', result_users)


@socketio.on('mark-msgs-as-read')
def set_msgs_as_read(msg_ids):
    if len(msg_ids) == 0:
        return

    msgs: list[Message] = db.session.query(
        Message).filter(Message.id.in_(msg_ids)).all()

    for m in msgs:
        m.read_by_recipient = True

    db.session.commit()

    msg_ids = [m.id for m in msgs]
    if msgs[0].sender.session_id:
        emit('companion-read-msgs', msg_ids, room=msgs[0].sender.session_id)


@socketio.on('load-more-messages')
def load_more_messages(params):
    comp_id = params['companion-id']
    chat = db.session.query(Chat).filter((Chat.user1_id == comp_id) | (Chat.user2_id == comp_id))\
        .filter((Chat.user1_id == current_user.id) | (Chat.user2_id == current_user.id)).scalar()

    msgs_to_return = db.session.query(Message).filter(
        Message.chat_id == chat.id, Message.id < params['start-message-id']).order_by(Message.timestamp.desc()).limit(25).all()

    attachments: list[Attachment] = db.session.query(Attachment)\
        .filter(
        Attachment.message_id > msgs_to_return[-1].id,
        Attachment.message_id <= msgs_to_return[0].id
    ).all()

    msgs_to_return = [m.to_dict() for m in msgs_to_return]

    for m in msgs_to_return:
        if m['id'] in [a.message_id for a in attachments]:
            m['attachments'] = [{'name': f.meta["name"], 'file_number': f.meta['file_number'],
                                 'size': f.meta['size'], 'type': f.attachment_type} for f in attachments if f.message_id == m['id']]

    emit('more-chat-messages-response', msgs_to_return)


@socketio.on('remove-message')
def remove_message(id):
    msg: Message = db.session.query(Message).filter(Message.id == id).scalar()
    if msg.sender_id != current_user.id:
        return

    msg_to_return = msg

    attachments: list[Attachment] = db.session.query(
        Attachment).filter(Attachment.message_id == id).all()

    dir_path = os.path.join(app.root_path, 'user_data',
                            'attachments', f"msg_{msg.id}")

    for a in attachments:
        db.session.delete(a)
        if os.path.exists(os.path.join(dir_path, a.meta['name'])):
            os.remove(os.path.join(dir_path, a.meta['name']))
            print(
                f"{os.path.join(dir_path, a.meta['name'])} has been deleted successfully!")
        else:
            print(f"{os.path.join(dir_path, a.meta['name'])} does not exist!")
    os.rmdir(dir_path)

    db.session.delete(msg)
    db.session.commit()

    emit('message-removed', msg_to_return.to_dict())

    chat: Chat = db.session.query(Chat).filter(Chat.id == msg.chat_id).scalar()

    if current_user == chat.user1 and chat.user2.session_id:
        emit('message-removed', msg_to_return.to_dict(),
             room=chat.user2.session_id)
    elif current_user == chat.user2 and chat.user1.session_id:
        emit('message-removed', msg_to_return.to_dict(),
             room=chat.user1.session_id)


@socketio.on('remove-chat')
def remove_chat(user_id):
    chat = get_chat(user_id, current_user.id)

    if chat:
        msgs: int = db.session.query(
            Message).filter(Message.chat_id == chat.id).all()
        
        print(msgs)
        for m in msgs:
            attachments: list[Attachment] = db.session.query(
            Attachment).filter(Attachment.message_id == m.id).all()

            if attachments:
                dir_path = os.path.join(app.root_path, 'user_data',
                                    'attachments', f"msg_{m.id}")
                for a in attachments:
                    db.session.delete(a)
                    if os.path.exists(os.path.join(dir_path, a.meta['name'])):
                        os.remove(os.path.join(dir_path, a.meta['name']))
                        print(
                            f"{os.path.join(dir_path, a.meta['name'])} has been deleted successfully!")
                    else:
                        print(f"{os.path.join(dir_path, a.meta['name'])} does not exist!")

                os.rmdir(dir_path)
            db.session.delete(m)
        
        db.session.delete(chat)
        try:
            db.session.commit()
        except:
            print("### An error ocurred while trying to delete chat")
            return

    emit('chat-removed', user_id)

    companion_session_id = db.session.query(
        User.session_id).filter(User.id == user_id).scalar()

    if companion_session_id:
        emit('chat-removed', current_user.id, room=companion_session_id)
