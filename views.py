from main import app
from flask import render_template, redirect, url_for
from flask_login import login_required, current_user

@app.route('/', methods=['GET'])
@login_required
def index():
    return render_template('main.html', user=current_user)

@app.route('/login', methods=['GET'])
def login():
    return render_template('auth.html')
