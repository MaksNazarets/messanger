import { insertNewElement } from './custom_functions.js'

const login_form = document.querySelector('#login-form');
const create_account_form = document.querySelector('#create-account-form');


document.querySelector('#unfold-acc-creation-form_btn').addEventListener('click', (e) => {
    login_form.classList.toggle('hidden');
    create_account_form.classList.toggle('hidden');
})

document.querySelector('#cancel-acc-creation_btn').addEventListener('click', (e) => {
    login_form.classList.toggle('hidden');
    create_account_form.classList.toggle('hidden');
})


create_account_form.addEventListener('submit', (event) => {
    event.preventDefault();

    document.querySelector('.wait-block').classList.remove('hidden')

    const error_elems = create_account_form.querySelectorAll('.error-msg');
    for (let ee of error_elems)
        ee.remove();

    const inputs = create_account_form.querySelectorAll('input');
    for (let input of inputs)
        input.classList.remove('error-input');

    const formData = new FormData(create_account_form);
    const url = "/create-account";
    const options = {
        method: "POST",
        body: formData
    };

    fetch(url, options)
        .then(response => {
            if (response.ok)
                return response.json()
            else
                throw new Error("Server cannot process the data. Some values might be invalid");
        })
        .then(data => {
            console.log(data);
            if ('message' in data) {
                insertNewElement('span', ['success-msg'], 'Обліковий запис успішно створено!', login_form, false);
                login_form.classList.toggle('hidden');
                create_account_form.classList.toggle('hidden');
                for (let input of inputs)
                    input.value = '';
            } else if ('errors' in data) {
                let errors = data['errors']
                if ('first-name' in errors) {
                    let new_fn_input = document.querySelector('#first-name');
                    insertNewElement('span', ['error-msg'], errors['first-name'], new_fn_input)
                    new_fn_input.classList.add('error-input')
                }
                if ('last-name' in errors) {
                    let new_ln_input = document.querySelector('#last-name');
                    insertNewElement('span', ['error-msg'], errors['last-name'], new_ln_input)
                    new_ln_input.classList.add('error-input')
                }
                if ('email' in errors) {
                    let new_email_input = document.querySelector('#email');
                    insertNewElement('span', ['error-msg'], errors['email'], new_email_input)
                    new_email_input.classList.add('error-input')
                }
                if ('username' in errors) {
                    let new_un_input = document.querySelector('#new-username');
                    insertNewElement('span', ['error-msg'], errors['username'], new_un_input)
                    new_un_input.classList.add('error-input')
                }
                if ('password' in errors) {
                    let new_password_input = document.querySelector('#new-password');
                    insertNewElement('span', ['error-msg'], errors['password'], new_password_input)
                    new_password_input.classList.add('error-input')
                }
            } else
                console.log('Invalid response data received')


            document.querySelector('.wait-block').classList.add('hidden')
        })
        .catch(error => {
            console.log(error);
            document.querySelector('.wait-block').classList.add('hidden')
        })
});

login_form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(login_form);
    const url = "/authorization";
    const options = {
        method: "POST",
        body: formData
    };

    fetch(url, options)
        .then(response => {
            if (response.ok){
                console.log('Successful login');
                window.location.href = "/";
            }
            else {
                const error_elems = document.querySelectorAll('.error-msg');
                for (let ee of error_elems)
                    ee.remove();

                const success_elems = document.querySelectorAll('.success-msg');
                for (let se of success_elems)
                    se.remove();

                insertNewElement('span', ['error-msg'], 'Неправильний логін або пароль', login_form, false)
            }
        });
})