import { PopUpMessage } from "./PopUpMessage.js";

type newData = {
    newFirstName: string,
    newLastName: string,
    newEmail: string,
    newLogin: string,
    newPass: string,
    newPhoto: string
}

export class ProfileSettings {
    private user: { id: number, first_name: string, last_name: string, username: string, email: string };
    private fullScreenContainer: HTMLElement;

    constructor(user: { id: number, first_name: string, last_name: string, username: string, email: string }) {
        this.user = user;
        this.fullScreenContainer = document.createElement('div');
    }

    show() {
        // Create the outermost container element
        this.fullScreenContainer.classList.add('full-screen-container', 'hidden');

        // Create the user info wrapper element
        const userInfoWrapper = document.createElement('div');
        userInfoWrapper.classList.add('user-info_wrapper', 'minimized');

        const _userInfoScrollBody = document.createElement('form');
        userInfoWrapper.appendChild(_userInfoScrollBody);

        // Create the user info title element
        const userInfoTitle = document.createElement('span');
        userInfoTitle.classList.add('user-info__title');
        userInfoTitle.textContent = 'Налаштування профілю';
        _userInfoScrollBody.appendChild(userInfoTitle);

        // Create the user info profile photo element
        const userInfoProfilePhoto = document.createElement('div');
        userInfoProfilePhoto.classList.add('user-info__profile-photo');
        _userInfoScrollBody.appendChild(userInfoProfilePhoto);
        userInfoProfilePhoto.style.backgroundImage = `url('/${this.user.id}/profile-photo?now=${new Date().getTime()}')`;

        // Create the credentials container element
        const credentialsContainer = document.createElement('div');
        credentialsContainer.classList.add('credentials-container');

        // Create the full name element
        const fullName = document.createElement('input');
        fullName.classList.add('full-name', 'field');
        fullName.disabled = true;
        credentialsContainer.appendChild(fullName);

        // Create the username element
        const username = document.createElement('input');
        username.classList.add('username', 'field');
        username.name = 'username';
        username.placeholder = 'логін'
        username.disabled = true;
        credentialsContainer.appendChild(username);

        _userInfoScrollBody.appendChild(credentialsContainer);

        const email = document.createElement('input');
        email.classList.add('email', 'field');
        email.name = 'email';
        email.placeholder = 'ел. пошта';
        email.disabled = true;
        email.value = this.user.email;
        email.autocomplete = 'email';
        credentialsContainer.appendChild(email);

        const unfoldPasswordFieldsBtn = document.createElement('span');
        unfoldPasswordFieldsBtn.classList.add('unfold-pass-fields-btn', 'hidden', 'pass-hidden');
        unfoldPasswordFieldsBtn.innerText = 'Змінити пароль'
        credentialsContainer.appendChild(unfoldPasswordFieldsBtn);

        // TODO: onclick 

        const pass1 = document.createElement('input');
        pass1.classList.add('password', 'field');
        pass1.placeholder = 'поточний пароль';
        pass1.type = 'password';
        pass1.name = 'current-pass';
        pass1.disabled = true;
        pass1.value = '*****';
        pass1.autocomplete = 'current-password';
        credentialsContainer.appendChild(pass1);

        const pass2 = document.createElement('input');
        pass2.classList.add('password', 'field', 'hidden');
        pass2.placeholder = 'новий пароль';
        pass2.type = 'password';
        pass2.name = 'new-pass';
        pass2.autocomplete = 'new-password';
        credentialsContainer.appendChild(pass2);

        unfoldPasswordFieldsBtn.onclick = () => {
            unfoldPasswordFieldsBtn.classList.toggle('pass-hidden')
            pass1.classList.toggle('hidden');
            pass2.classList.toggle('hidden');
        }

        // Create the send message button element
        const editDataBtn = this.createBigBtn('редагувати дані');
        editDataBtn.classList.add('main-btn');
        editDataBtn.type = 'button';
        _userInfoScrollBody.appendChild(editDataBtn);

        editDataBtn.onclick = () => {
            fullName.classList.add('hidden');
            pass1.classList.add('hidden');
            editDataBtn.classList.add('hidden');
            unfoldPasswordFieldsBtn.classList.remove('hidden');

            [username, email, pass1].forEach(field => field.disabled = false)
            pass1.value = pass2.value = '';
            username.value = this.user.username;

            const photoInput = document.createElement('input');
            photoInput.style.display = 'none';
            photoInput.type = 'file';
            photoInput.accept = 'image/*';
            photoInput.name = 'profile-photo';

            photoInput.onchange = (event: Event) => {
                if (event.target) {
                    const selectedFile = ((event.target) as HTMLInputElement).files?.[0];
                    console.log("Selected file:", selectedFile);

                    if (selectedFile) {
                        const formData = new FormData();
                        formData.append('image', selectedFile);

                        fetch('/set-temp-profile-photo', {
                            method: 'POST',
                            body: formData
                        })
                            .then(response => response.blob())
                            .then(response => {
                                console.log('Upload successful:', response);
                                console.log(typeof response);
                                if (response instanceof Blob) {
                                    const url = URL.createObjectURL(response);
                                    userInfoProfilePhoto.style.backgroundImage = `url(${url})`;
                                }
                            })
                            .catch(error => {
                                console.error('Error uploading image:', error);
                            });
                    }
                }
            };
            _userInfoScrollBody.appendChild(photoInput);


            const editPhotoBtn = this.createBigBtn('змінити фото');
            editPhotoBtn.classList.add('translucent');
            editPhotoBtn.type = 'button';
            editPhotoBtn.onclick = () => photoInput.click();
            userInfoProfilePhoto.appendChild(editPhotoBtn);

            const firstName = document.createElement('input');
            firstName.classList.add('first-name', 'field');
            firstName.name = 'first-name';
            firstName.placeholder = "ім'я";
            firstName.value = this.user.first_name;
            credentialsContainer.insertBefore(firstName, username);

            const lastName = document.createElement('input');
            lastName.classList.add('last-name', 'field');
            lastName.name = 'last-name';
            lastName.placeholder = "прізвище";
            lastName.value = this.user.last_name;
            credentialsContainer.insertBefore(lastName, username);

            const saveBtn = this.createBigBtn('зберегти');
            saveBtn.classList.add('main-btn');

            saveBtn.type = 'submit';

            _userInfoScrollBody.onsubmit = (e: Event) => {
                e.preventDefault();

                let formData = new FormData(_userInfoScrollBody);
                if (unfoldPasswordFieldsBtn.classList.contains('pass-hidden')) {
                    console.log('hidden');
                    formData.delete('current-pass');
                    formData.delete('new-pass');
                }

                const backdrop = document.createElement('div');
                backdrop.classList.add('wait-block')
                userInfoWrapper.appendChild(backdrop);

                fetch('/edit-profile-data', {
                    method: 'POST',
                    body: formData
                })
                    .then(response => {
                        userInfoWrapper.removeChild(backdrop);

                        if (response.ok) return response.json()
                        else new Error('Server error (500)')
                    })
                    .then(data => {
                        if (data == 'Ok') {
                            this.hide();
                            new PopUpMessage('Дані успішно змінено').show();
                            console.log('Profile data changed successfully:', data);
                        }
                        else {
                            console.log(data);
                            const errors = data['errors'];

                            new PopUpMessage(errors[Object.keys(errors)[0]]).show()
                        }
                    })
                    .catch(error => {
                        console.error('Error editing data:', error);
                    });
            }

            const cancelBtn = this.createBigBtn('скасувати');
            credentialsContainer.appendChild(saveBtn);
            _userInfoScrollBody.appendChild(cancelBtn);

            cancelBtn.onclick = () => {
                userInfoProfilePhoto.style.backgroundImage = `url('/${this.user.id}/profile-photo')`;
                credentialsContainer.removeChild(firstName);
                credentialsContainer.removeChild(lastName);
                credentialsContainer.removeChild(saveBtn);
                _userInfoScrollBody.removeChild(cancelBtn);
                userInfoProfilePhoto.removeChild(editPhotoBtn);

                unfoldPasswordFieldsBtn.classList.add('hidden');

                pass1.classList.add('hidden');
                pass2.classList.add('hidden');
                fullName.classList.remove('hidden');
                editDataBtn.classList.remove('hidden');

                [username, email, pass1].forEach(field => field.disabled = true);
                pass1.value = pass2.value = '*****';
                username.value = '@' + this.user.username;
            }
        }

        this.fullScreenContainer.appendChild(userInfoWrapper);
        this.fullScreenContainer.classList.remove('hidden');

        fullName.value = `${this.user.first_name} ${this.user.last_name}`;
        username.value = '@' + this.user.username;

        document.body.appendChild(this.fullScreenContainer);

        setTimeout(() => {
            userInfoWrapper?.classList.remove('minimized');
        }, 1);

        this.fullScreenContainer.addEventListener('mousedown', this.handleCloseWindow);
    }

    private handleCloseWindow = (event: MouseEvent) => {
        if (event.target !== this.fullScreenContainer) return;

        this.hide();
    }

    private createBigBtn = (text: string) => {
        const btn = document.createElement('button');
        btn.classList.add('big-profile-btn');
        btn.textContent = text;

        return btn;
    }

    hide() {
        this.fullScreenContainer.removeEventListener('mousedown', this.handleCloseWindow);
        document.body.removeChild(this.fullScreenContainer);
    }
}
