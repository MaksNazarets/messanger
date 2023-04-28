from main import app, db, login_manager
from flask import request, jsonify, flash, redirect, url_for
from flask_login import login_user, logout_user, login_required
from werkzeug.exceptions import Unauthorized
from models import User
from werkzeug.security import generate_password_hash, check_password_hash
import os
from my_functions import get_data_errors

@login_manager.user_loader
def load_user(user_id):
    with app.app_context():
        return db.session.execute(db.select(User).filter_by(id=int(user_id))).scalar()

@app.route('/create-account', methods=['POST'])
def create_account():

    first_name = request.form.get('first-name').strip()
    last_name = request.form.get('last-name').strip()
    email = request.form.get('email').strip()
    username = request.form.get('new-username').strip()
    password = request.form.get('new-password').strip()
    
    
    errors = get_data_errors(first_name, last_name, email, username, password, db)
    
    if errors:
        return jsonify(errors=errors), 200

    try:
        hashed_password = generate_password_hash(password, method='sha256')
        new_user = User(first_name, last_name,
                    username, email, hashed_password)
        db.session.add(new_user)
        db.session.commit()
    
        path = os.path.join(app.root_path, f"user_data/profile_photos/user_{new_user.id}")
        if not os.path.exists(path):
            os.makedirs(path)
    except:
        errors['unpredictable'] = 'Під час створення облікового запису виникла невідома помилка :('
        return jsonify(errors=errors), 200

    return jsonify('Ok'), 200


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