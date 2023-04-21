var _a, _b;
import { insertNewElement } from './custom_functions.js';
var login_form = document.querySelector('#login-form');
var create_account_form = document.querySelector('#create-account-form');
(_a = document.querySelector('#unfold-acc-creation-form_btn')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function (e) {
    login_form.classList.toggle('hidden');
    create_account_form.classList.toggle('hidden');
});
(_b = document.querySelector('#cancel-acc-creation_btn')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', function (e) {
    login_form.classList.toggle('hidden');
    create_account_form.classList.toggle('hidden');
});
create_account_form.addEventListener('submit', function (event) {
    var _a;
    event.preventDefault();
    (_a = document.querySelector('.wait-block')) === null || _a === void 0 ? void 0 : _a.classList.remove('hidden');
    var inputs = create_account_form.querySelectorAll('input');
    inputs.forEach(function (input) {
        input.classList.remove('error-input');
    });
    var formData = new FormData(create_account_form);
    var url = "/create-account";
    var options = {
        method: "POST",
        body: formData
    };
    fetch(url, options)
        .then(function (response) {
        if (response.ok)
            return response.json();
        else
            throw new Error("Server cannot process the data. Some values might be invalid");
    })
        .then(function (data) {
        var _a;
        console.log(data);
        var error_elems = create_account_form.querySelectorAll('.error-msg');
        error_elems.forEach(function (ee) {
            ee.remove();
        });
        if ('message' in data) {
            insertNewElement('span', ['success-msg'], 'Обліковий запис успішно створено!', login_form, false);
            login_form.classList.toggle('hidden');
            create_account_form.classList.toggle('hidden');
            var login_login = login_form.querySelector('#usernames');
            login_login.value = create_account_form.querySelector('#new-username').value;
            var login_password = login_form.querySelector('#password');
            login_password.value = create_account_form.querySelector('#new-password').value;
            inputs.forEach(function (input) {
                input.value = '';
            });
        }
        else if ('errors' in data) {
            var errors = data['errors'];
            if ('first-name' in errors) {
                var new_fn_input = document.querySelector('#first-name');
                insertNewElement('span', ['error-msg'], errors['first-name'], new_fn_input);
                new_fn_input.classList.add('error-input');
            }
            if ('last-name' in errors) {
                var new_ln_input = document.querySelector('#last-name');
                insertNewElement('span', ['error-msg'], errors['last-name'], new_ln_input);
                new_ln_input.classList.add('error-input');
            }
            if ('email' in errors) {
                var new_email_input = document.querySelector('#email');
                insertNewElement('span', ['error-msg'], errors['email'], new_email_input);
                new_email_input.classList.add('error-input');
            }
            if ('username' in errors) {
                var new_un_input = document.querySelector('#new-username');
                insertNewElement('span', ['error-msg'], errors['username'], new_un_input);
                new_un_input.classList.add('error-input');
            }
            if ('password' in errors) {
                var new_password_input = document.querySelector('#new-password');
                insertNewElement('span', ['error-msg'], errors['password'], new_password_input);
                new_password_input.classList.add('error-input');
            }
        }
        else
            console.log('Invalid response data received');
        (_a = document.querySelector('.wait-block')) === null || _a === void 0 ? void 0 : _a.classList.add('hidden');
    })
        .catch(function (error) {
        var _a;
        console.log(error);
        (_a = document.querySelector('.wait-block')) === null || _a === void 0 ? void 0 : _a.classList.add('hidden');
    });
});
login_form.addEventListener('submit', function (event) {
    event.preventDefault();
    var formData = new FormData(login_form);
    var url = "/authorization";
    var options = {
        method: "POST",
        body: formData
    };
    fetch(url, options)
        .then(function (response) {
        if (response.ok) {
            console.log('Successful login');
            window.location.href = "/";
        }
        else {
            var error_elems = document.querySelectorAll('.error-msg');
            error_elems.forEach(function (ee) {
                ee.remove();
            });
            var success_elems = document.querySelectorAll('.success-msg');
            success_elems.forEach(function (se) {
                se.remove();
            });
            insertNewElement('span', ['error-msg'], 'Неправильний логін або пароль', login_form, false);
        }
    });
});
var show_pass_btn = create_account_form.querySelector('.show-pass-btn');
show_pass_btn.addEventListener('mousedown', function () {
    create_account_form.querySelector('#new-password').setAttribute('type', 'text');
});
show_pass_btn.addEventListener('mouseup', function () {
    create_account_form.querySelector('#new-password').setAttribute('type', 'password');
});
//# sourceMappingURL=auth.js.map