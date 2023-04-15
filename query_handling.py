from main import app, db, current_user, login_required
from models import User, Chat
# from flask_login import login_required
from flask import jsonify

@app.route('/getchatlist', methods=['POST'])
@login_required
def getchatlist():
    user: User = current_user
    
    with app.app_context():
        chats: list[Chat] = db.session.execute(db.select(Chat).filter((Chat.user1==user) | (Chat.user2==user))).scalars().all()
        # dict_chats = [i.to_dict() for i in chats]

        chat_users = []
        for chat in chats:
            chat_user = chat.user1 if chat.user2_id == user.id else chat.user2
            user_data = {'full_name': f'{chat_user.first_name} {chat_user.last_name}',
                         'chat_id': chat.id}
            chat_users.append(user_data)

        # print(dict_chats)
        print(chat_users)

        return jsonify(chat_users), 200
    
