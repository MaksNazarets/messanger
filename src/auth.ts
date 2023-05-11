import { insertNewElement } from './custom_functions.js'

const login_form = document.querySelector('#login-form') as HTMLFormElement;
const create_account_form = document.querySelector('#create-account-form') as HTMLFormElement;


document.querySelector('#unfold-acc-creation-form_btn')?.addEventListener('click', (e) => {
    login_form.classList.toggle('hidden');
    create_account_form.classList.toggle('hidden');
})

document.querySelector('#cancel-acc-creation_btn')?.addEventListener('click', (e) => {
    login_form.classList.toggle('hidden');
    create_account_form.classList.toggle('hidden');
})


create_account_form.addEventListener('submit', (event) => {
    event.preventDefault();

    document.querySelector('.wait-block')?.classList.remove('hidden')

    const inputs = create_account_form.querySelectorAll('input');
    inputs.forEach(input => {
        input.classList.remove('error-input');
    })

    const pass_group = document.querySelector('.password-group')!;
    pass_group.classList.remove('error-input');

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

            const error_elems = create_account_form.querySelectorAll('.error-msg');
            error_elems.forEach(ee => {
                ee.remove();
            })

            if (data === 'Ok') {
                insertNewElement('span', ['success-msg'], 'Обліковий запис успішно створено!', login_form, false);
                login_form.classList.toggle('hidden');
                create_account_form.classList.toggle('hidden');

                const login_login = login_form.querySelector('#username') as HTMLInputElement;
                login_login.value = (create_account_form.querySelector('#new-username') as HTMLInputElement).value

                const login_password = login_form.querySelector('#password') as HTMLInputElement;
                login_password.value = (create_account_form.querySelector('#new-password') as HTMLInputElement).value

                inputs.forEach(input => {
                    input.value = '';
                });
            }
            else if ('errors' in data) {
                let errors = data['errors']
                if ('first-name' in errors) {
                    const new_fn_input = document.querySelector('#first-name')!;
                    insertNewElement('span', ['error-msg'], errors['first-name'], new_fn_input)
                    new_fn_input.classList.add('error-input');
                }
                if ('last-name' in errors) {
                    const new_ln_input = document.querySelector('#last-name')!;
                    insertNewElement('span', ['error-msg'], errors['last-name'], new_ln_input)
                    new_ln_input.classList.add('error-input')
                }
                if ('email' in errors) {
                    const new_email_input = document.querySelector('#email')!;
                    insertNewElement('span', ['error-msg'], errors['email'], new_email_input)
                    new_email_input.classList.add('error-input')
                }
                if ('username' in errors) {
                    const new_un_input = document.querySelector('#new-username')!;
                    insertNewElement('span', ['error-msg'], errors['username'], new_un_input)
                    new_un_input.classList.add('error-input')
                }
                if ('password' in errors) {
                    insertNewElement('span', ['error-msg'], errors['password'], pass_group)
                    pass_group.classList.add('error-input')
                }
            } else
                console.log('Invalid response data received')

            document.querySelector('.wait-block')?.classList.add('hidden')
        })
        .catch(error => {
            console.log(error);
            document.querySelector('.wait-block')?.classList.add('hidden')
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
            if (response.ok) {
                console.log('Successful login');
                window.location.href = "/";
            }
            else {
                const error_elems = document.querySelectorAll('.error-msg');
                error_elems.forEach(ee => {
                    ee.remove();
                });

                const success_elems = document.querySelectorAll('.success-msg');
                success_elems.forEach(se => {
                    se.remove();
                });

                insertNewElement('span', ['error-msg'], 'Неправильний логін або пароль', login_form, false)
            }
        });
})

const show_pass_btn = create_account_form.querySelector('.show-pass-btn')!;

show_pass_btn.addEventListener('mousedown', () => {
    create_account_form.querySelector('#new-password')!.setAttribute('type', 'text');
});

show_pass_btn.addEventListener('mouseup', () => {
    create_account_form.querySelector('#new-password')!.setAttribute('type', 'password');
})