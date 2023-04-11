from main import app, db, login_manager
from flask import request, jsonify, flash, redirect, url_for
from flask_login import login_user, logout_user, login_required
from werkzeug.exceptions import Unauthorized
from email_validator import validate_email, EmailNotValidError
from models import User
from werkzeug.security import generate_password_hash, check_password_hash
import re


@login_manager.user_loader
def load_user(user_id):
    with app.app_context():
        return db.session.execute(db.select(User).filter_by(id=int(user_id))).scalar()

@app.route('/create-account', methods=['POST'])
def create_account():
    errors = {}

    # Get the form data from the request
    first_name = request.form.get('first-name').strip()
    last_name = request.form.get('last-name').strip()
    email = request.form.get('email').strip()
    username = request.form.get('new-username').strip()
    password = request.form.get('new-password').strip()

    # Validate the form data
    if not first_name:
        errors['first-name'] = 'Поле є обов\'язковим'
    elif len(first_name) > 50:
        errors['first-name'] = 'Ім\'я не може бути довше 50 символів'

    if not last_name:
        errors['last-name'] = 'Поле є обов\'язковим'
    elif len(last_name) > 50:
        errors['last-name'] = 'Прізвище не може бути довше 50 символів'

    if not email:
        errors['email'] = 'Поле є обов\'язковим'
    else:
        try:
            # Validate and get the normalized email address
            valid = validate_email(email)
            email = valid.email

        except EmailNotValidError as e:
            errors['email'] = f"Електронна адреса некоректна"

    if not username:
        errors['username'] = 'Поле є обов\'язковим'
    elif len(username) < 3:
        errors['username'] = 'Логін має бути довжиною не менше 3 символів'
    elif len(username) > 50:
        errors['username'] = 'Логін не може бути довше 50 символів'
    elif username[0].isdigit():
        errors['username'] = 'Логін не може починатись з цифри'
    elif username[0] == '_':
        errors['username'] = 'Логін не може починатись з символу "_"'
    else:
        pattern = r"^[a-zA-Z_][a-zA-Z0-9_]*$"
        if not re.match(pattern, username):
            errors['username'] = 'Логін може містити лише літери, цифри та символ "_"'

    if not password:
        errors['password'] = 'Поле є обов\'язковим'
    elif len(password) < 8:
        errors['password'] = 'Пароль має бути довжиною не менше 8 символів'
    elif len(password) > 255:
        errors['password'] = 'Пароль не може бути довше 255 символів'

    # If there are errors, return them as a JSON response
    if errors:
        return jsonify(errors=errors), 200

    try:
        with app.app_context():
            identical_username_count = len(db.session.execute(
                db.select(User).filter_by(username=username)).scalars().all())

            if identical_username_count > 0:
                errors['username'] = 'Цей логін вже зайнятий іншим користувачем'

            identical_email_count = len(db.session.execute(
                db.select(User).filter_by(email=email)).scalars().all())

            if identical_email_count > 0:
                errors['email'] = 'До цієї ел. пошти вже прив\'язано обліковий запис'

            if errors:
                return jsonify(errors=errors), 200

            hashed_password = generate_password_hash(password, method='sha256')
            db.session.add(User(first_name, last_name,
                           username, email, hashed_password))
            db.session.commit()
            return jsonify(message='Account created successfully.'), 200

    except Exception as e:
        errors['unpredictable'] = 'Під час запису даних до бази даних сталась помилка... Спробуйте пізніше, або зв\'яжіться зі службою підтримки'
        return jsonify(errors=errors), 200


@app.route('/authorization', methods=['POST'])
def authorize():
    login = request.form.get('username').strip()
    password = request.form.get('password').strip()

    with app.app_context():
        user: User = db.session.execute(db.select(User).filter_by(
            username=login)).scalar()

    if user is None:
        return 'Invalid data', 401
    elif not check_password_hash(user.password, password):
        return 'Invalid data', 401
    else:
        login_user(user)
        flash(f'Привіт, {user.first_name}', 'success')
        return 'Success', 200


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))


@app.errorhandler(Unauthorized)
def handle_unauthorized(error):
    response = jsonify({'error': 'Unauthorized access'})
    response.status_code = 401
    return redirect(url_for('login'), Response=response)