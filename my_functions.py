from email_validator import validate_email, EmailNotValidError
from models import User
import re

def get_data_errors(first_name: str, last_name: str, 
                    email: str, username: str, 
                    password: str = 'goodpassword123', db = None, 
                    allowed_data={'email': [], 'username': []}):
    errors = {}

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
            errors['username'] = 'Логін може містити лише латинські літери, цифри та символ "_"'

    if not password:
        errors['password'] = 'Поле є обов\'язковим'
    elif len(password) < 8:
        errors['password'] = 'Пароль має бути довжиною не менше 8 символів'
    elif len(password) > 255:
        errors['password'] = 'Пароль не може бути довше 255 символів'


    if db:
        try:
            identical_username_count = len(db.session.execute(
                db.select(User).filter_by(username=username)).all())

            if identical_username_count > 0 and username not in allowed_data['username']:
                errors['username'] = 'Цей логін вже зайнятий іншим користувачем'

            identical_email_count = len(db.session.execute(
                db.select(User).filter_by(email=email)).all())

            if identical_email_count > 0 and email not in allowed_data['email']:
                errors['email'] = 'До цієї ел. пошти вже прив\'язано обліковий запис'

        except:
            errors['unpredictable'] = 'Під час запису даних до бази даних сталась помилка... Спробуйте пізніше, або зв\'яжіться зі службою підтримки'

    return errors
