from main import app, db, socketio
import os
import fnmatch
from flask import send_file, request, jsonify
from flask_login import current_user
from werkzeug.security import check_password_hash, generate_password_hash
import io
import imghdr
from models import User, Attachment
from my_functions import get_data_errors


@app.route('/<int:user_id>/profile-photo')
def get_profile_photo(user_id):
    path_to_folder = os.path.join(
        app.root_path, f"user_data/profile_photos/user_{user_id}")
    for file in os.listdir(path_to_folder):
        # Check if the filename matches the pattern
        if fnmatch.fnmatch(file, '1.*'):
            print(file)

            filename = f'{path_to_folder}/{file}'
            return send_file(filename, mimetype='image/png')

    return send_file(os.path.join(app.root_path, f"user_data/profile_photos/default/light-2.png"), mimetype='image/png')


@app.route('/attachment')
def get_attachment():
    msg_id = int(request.args.get('msgid'))
    filenumber = int(request.args.get('filenumber'))

    if not msg_id or not filenumber:
        return 400

    path_to_folder = os.path.join(
        app.root_path, f"user_data/attachments/msg_{msg_id}")
    

    if not msg_id or not filenumber:
        return 400

    path_to_folder = os.path.join(
        app.root_path, f"user_data/attachments/msg_{msg_id}")

    all_files: list[Attachment] = db.session.query(Attachment).filter(Attachment.message_id==msg_id).all()
    filename = ''
    for f in all_files:
        if f.meta['file_number'] == filenumber:
            filename = f.meta['name']

    return send_file(os.path.join(path_to_folder, filename))



@app.route('/get-me', methods=['POST'])
def get_me():
    return current_user.to_dict()


@app.route('/set-temp-profile-photo', methods=['POST'])
def set_temp_profile_photo():
    file = request.files['image']
    print('type: ', imghdr.what(file))
    print(file)

    buffer = io.BytesIO()
    buffer.write(file.read())
    buffer.seek(0)
    mime_type = 'image/*'

    # Return the image data as a Blob object
    return send_file(buffer, mimetype=mime_type)

    # return 'Wrong data type', 400


@app.route('/edit-profile-data', methods=['POST'])
def edit_profile_data():
    data = request.form
    first_name = data.get('first-name')
    last_name = data.get('last-name')
    email = data.get('email')
    username = data.get('username')

    current_pass = data.get('current-pass', False)
    new_pass = data.get('new-pass', False)

    user: User = db.session.query(User).filter(
        User.id == current_user.id).scalar()

    if current_pass and new_pass:
        errors = get_data_errors(
            first_name, last_name, email, username, new_pass)

        if not check_password_hash(user.password, current_pass):
            errors['password'] = 'Поточний пароль неправильний'
    else:
        errors = get_data_errors(first_name, last_name, email, username)

    if errors:
        return jsonify(errors=errors), 200

    user.first_name = first_name
    user.last_name = last_name
    user.username = username
    user.email = email

    if current_pass and new_pass:
        user.password = generate_password_hash(new_pass, method='sha256')

    try:
        db.session.commit()
        photo = request.files['profile-photo']
        if photo:
            extension = os.path.splitext(photo.filename)[-1]

            directory = os.path.join(
                app.root_path, f"user_data/profile_photos/user_{current_user.id}")
            for filename in os.listdir(directory):
                name = os.path.splitext(filename)[0]
                if name == "1":
                    os.remove(os.path.join(directory, filename))

            photo.save(f"{directory}/1{extension}")

        socketio.emit('profile-data-update',
                      user.to_dict(), room=user.session_id)
        return jsonify('Ok'), 200

    except:
        return 500


@app.route('/process-premium-status-query', methods=['POST'])
def process_premium_status_query():
    user: User = db.session.query(User).filter(
        User.id == current_user.id).scalar()
    user.has_premium = True
    db.session.commit()

    return jsonify({'status': 'success'}), 200
