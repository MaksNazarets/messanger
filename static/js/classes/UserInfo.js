export class UserInfo {
    constructor(user, openChatAction) {
        this.handleCloseWindow = (event) => {
            if (event.target !== this.fullScreenContainer)
                return;
            this.hide();
        };
        this.userId = user.id;
        this.profilePhotoUrl = `/${user.id}/profile-photo`;
        this.fullName = `${user.first_name} ${user.last_name}`;
        this.username = user.username;
        this.fullScreenContainer = document.createElement('div');
        this.openChatAction = openChatAction;
    }
    show() {
        // Create the outermost container element
        this.fullScreenContainer.classList.add('full-screen-container', 'hidden');
        // Create the user info wrapper element
        const userInfoWrapper = document.createElement('div');
        userInfoWrapper.classList.add('user-info_wrapper', 'minimized');
        // Create the user info title element
        const userInfoTitle = document.createElement('span');
        userInfoTitle.classList.add('user-info__title');
        userInfoTitle.textContent = 'Інформація про користувача';
        userInfoWrapper.appendChild(userInfoTitle);
        // Create the user info profile photo element
        const userInfoProfilePhoto = document.createElement('div');
        userInfoProfilePhoto.classList.add('user-info__profile-photo');
        userInfoWrapper.appendChild(userInfoProfilePhoto);
        // Create the credentials container element
        const credentialsContainer = document.createElement('div');
        credentialsContainer.classList.add('credentials-container');
        // Create the full name element
        const fullName = document.createElement('span');
        fullName.classList.add('full-name', 'field');
        credentialsContainer.appendChild(fullName);
        // Create the username element
        const username = document.createElement('span');
        username.classList.add('username', 'field');
        credentialsContainer.appendChild(username);
        userInfoWrapper.appendChild(credentialsContainer);
        // Create the send message button element
        const UserInfosendMsgBtn = document.createElement('button');
        UserInfosendMsgBtn.classList.add('user-info_send-msg-btn');
        UserInfosendMsgBtn.textContent = 'Надіслати повідомлення';
        userInfoWrapper.appendChild(UserInfosendMsgBtn);
        this.fullScreenContainer.appendChild(userInfoWrapper);
        this.fullScreenContainer.classList.remove('hidden');
        userInfoProfilePhoto.style.backgroundImage = `url('${this.profilePhotoUrl}')`;
        fullName.textContent = `${this.fullName}`;
        username.textContent = '@' + this.username;
        document.body.appendChild(this.fullScreenContainer);
        setTimeout(() => {
            userInfoWrapper === null || userInfoWrapper === void 0 ? void 0 : userInfoWrapper.classList.remove('minimized');
        }, 1);
        UserInfosendMsgBtn.onclick = () => {
            this.hide();
            this.openChatAction(this.userId);
        };
        this.fullScreenContainer.addEventListener('click', this.handleCloseWindow);
    }
    hide() {
        this.fullScreenContainer.removeEventListener('click', this.handleCloseWindow);
        document.body.removeChild(this.fullScreenContainer);
    }
}
//# sourceMappingURL=UserInfo.js.map