"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserInfo = void 0;
var UserInfo = /** @class */ (function () {
    function UserInfo(user, openChatAction) {
        var _this = this;
        this.handleCloseWindow = function (event) {
            if (event.target !== _this.fullScreenContainer)
                return;
            _this.hide();
        };
        this.userId = user.id;
        this.profilePhotoUrl = "/".concat(user.id, "/profile_photo");
        this.fullName = "".concat(user.first_name, " ").concat(user.last_name);
        this.username = user.username;
        this.fullScreenContainer = document.createElement('div');
        this.openChatAction = openChatAction;
    }
    UserInfo.prototype.show = function () {
        var _this = this;
        // Create the outermost container element
        this.fullScreenContainer.classList.add('full-screen-container', 'hidden');
        // Create the user info wrapper element
        var userInfoWrapper = document.createElement('div');
        userInfoWrapper.classList.add('user-info_wrapper', 'minimized');
        // Create the user info title element
        var userInfoTitle = document.createElement('span');
        userInfoTitle.classList.add('user-info__title');
        userInfoTitle.textContent = 'Інформація про користувача';
        userInfoWrapper.appendChild(userInfoTitle);
        // Create the user info profile photo element
        var userInfoProfilePhoto = document.createElement('div');
        userInfoProfilePhoto.classList.add('user-info__profile-photo');
        userInfoWrapper.appendChild(userInfoProfilePhoto);
        // Create the credentials container element
        var credentialsContainer = document.createElement('div');
        credentialsContainer.classList.add('credentials-container');
        // Create the full name element
        var fullName = document.createElement('span');
        fullName.classList.add('full-name', 'field');
        credentialsContainer.appendChild(fullName);
        // Create the username element
        var username = document.createElement('span');
        username.classList.add('username', 'field');
        credentialsContainer.appendChild(username);
        userInfoWrapper.appendChild(credentialsContainer);
        // Create the send message button element
        var UserInfosendMsgBtn = document.createElement('button');
        UserInfosendMsgBtn.classList.add('user-info_send-msg-btn');
        UserInfosendMsgBtn.textContent = 'Надіслати повідомлення';
        userInfoWrapper.appendChild(UserInfosendMsgBtn);
        this.fullScreenContainer.appendChild(userInfoWrapper);
        this.fullScreenContainer.classList.remove('hidden');
        userInfoProfilePhoto.style.backgroundImage = "url('".concat(this.profilePhotoUrl, "')");
        fullName.textContent = "".concat(this.fullName, "}");
        username.textContent = '@' + this.username;
        document.body.appendChild(this.fullScreenContainer);
        setTimeout(function () {
            userInfoWrapper === null || userInfoWrapper === void 0 ? void 0 : userInfoWrapper.classList.remove('minimized');
        }, 1);
        UserInfosendMsgBtn.onclick = function () {
            _this.hide();
            _this.openChatAction(_this.userId);
        };
        this.fullScreenContainer.addEventListener('click', this.handleCloseWindow);
    };
    UserInfo.prototype.hide = function () {
        this.fullScreenContainer.removeEventListener('click', this.handleCloseWindow);
        document.body.removeChild(this.fullScreenContainer);
    };
    return UserInfo;
}());
exports.UserInfo = UserInfo;
