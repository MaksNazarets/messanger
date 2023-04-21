var _a;
import { isMessageVisible } from '/static/js/custom_functions.js';
import { ContextMenu } from './classes/ContextMenu.js';
var openChatCompanionId = 0;
var openChatCompanion;
var msgInput = document.querySelector('#new-message_input');
var searchInput = document.querySelector('#search-input');
var chatList = document.querySelector('.chat-list');
var resultList = document.querySelector('.result-list');
var chatContainer = document.querySelector('.chat-container');
var chatScrollable = document.querySelector('.chat-scrollable');
var rightPanel = document.querySelector('.right-panel');
var toLastMsgBtn = document.querySelector('.to-last-msg-btn');
var lastMsgSentAt = {};
var monthNames = ['січня', "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
var firstMessage = chatContainer.querySelector('.message:last-of-type');
var thirdMessage = chatContainer.querySelector('.message:nth-last-of-type(3)');
// let currentContextMenu: ContextMenu | null = null;
var socket = io.connect('http://' + location.hostname + ':' + location.port);
socket.on('connect', function () {
    var _a;
    console.log('connected!');
    (_a = document.querySelector('.no-network-wrapper')) === null || _a === void 0 ? void 0 : _a.classList.add('hidden');
});
socket.on('disconnect', function () {
    var _a;
    console.log('disconnected :(');
    (_a = document.querySelector('.no-network-wrapper')) === null || _a === void 0 ? void 0 : _a.classList.remove('hidden');
});
socket.on('update_chat_list', function (chatUsers) {
    populateWithChatItems(chatUsers, chatList);
});
socket.on('get_chat_data', function (chatData) {
    var _a;
    if (openChatCompanionId != 0)
        lastMsgSentAt[openChatCompanionId.toString()] = null;
    openChatCompanionId = chatData['companion']['id'];
    openChatCompanion = chatData['companion'];
    console.log(chatData);
    rightPanel.classList.remove('hidden');
    // setting user online status
    var companionInfo = rightPanel.querySelector('.companion-info');
    if (openChatCompanion['is_online'])
        companionInfo.classList.add('user-online');
    else
        companionInfo.classList.remove('user-online');
    companionInfo.addEventListener('click', function () {
        openUserInfoWindow(companion);
    });
    // setting companion data
    var profile_photo = rightPanel.querySelector('.chat-name__profile-photo');
    profile_photo.textContent = '';
    profile_photo.style.backgroundImage = "url('/".concat(chatData.companion.id, "/profile_photo')");
    var companion = openChatCompanion;
    rightPanel.querySelector('.chat-name__username').textContent = "".concat(companion['first_name'], " ").concat(companion['last_name']);
    // populating chat with messages
    chatScrollable.innerHTML = '';
    populateChatWithMessages(chatData['messages']);
    // Inserting 'unread' label to chat
    var unreadMessages = rightPanel.querySelectorAll('.message.unread');
    if (unreadMessages.length > 0
        && !unreadMessages[0].classList.contains('my-msg')) {
        var firstUnreadMessage = unreadMessages[unreadMessages.length - 1];
        var unreadSection = document.createElement('div');
        unreadSection.classList.add('unread-msgs-section');
        unreadSection.appendChild(document.createElement('div'));
        var unreadLabel = document.createElement('span');
        unreadLabel.classList.add('unread-msgs-section-label');
        unreadLabel.textContent = 'Непрочитані повідомлення';
        unreadSection.appendChild(unreadLabel);
        unreadSection.appendChild(document.createElement('div'));
        chatScrollable.insertBefore(unreadSection, firstUnreadMessage.nextSibling);
        unreadSection.classList.remove('hidden');
    }
    var justReadMsgsIds = [];
    unreadMessages.forEach(function (msgEl) {
        msgEl.classList.remove('unread');
        var msgId = parseInt(msgEl.getAttribute('data-id') || '');
        if (!isNaN(msgId)) {
            justReadMsgsIds.push(msgId);
        }
    });
    socket.emit('mark-msgs-as-read', justReadMsgsIds);
    //removing unread label from chat item
    var chatItem = document.querySelector(".chat-item[data-user-id=\"".concat(openChatCompanionId, "\"]"));
    if (chatItem) {
        var unreadLabel = chatItem.querySelector('.chat-item__unread-label');
        if (unreadLabel)
            unreadLabel.classList.add('hidden');
    }
    // check if the media query is currently active
    if (window.innerWidth < 600) {
        console.log('The media query is currently active');
        (_a = document.querySelector('.left-panel')) === null || _a === void 0 ? void 0 : _a.classList.add('hidden');
    }
});
socket.on('new-message', function (msgData) {
    if (msgData['sender_id'] != openChatCompanionId && !msgData['my-msg']) {
        var chatItem = document.querySelector(".chat-item[data-user-id='".concat(msgData['sender_id'], "']"));
        if (!chatItem)
            return;
        var unreadLabel = chatItem.querySelector('.chat-item__unread-label');
        if (unreadLabel.classList.contains('hidden')) {
            unreadLabel.classList.remove('hidden');
            unreadLabel.textContent = '1';
        }
        else {
            unreadLabel.textContent = (parseInt(unreadLabel.textContent || '0') + 1).toString();
        }
    }
    else {
        console.log('sdaa');
        var messageEl_1 = insertMessage(msgData, true, true);
        messageEl_1.classList.add("msg-minimized");
        setTimeout(function () {
            messageEl_1.classList.remove("msg-minimized");
            messageEl_1.classList.add("unread");
        }, 1);
        if (isMessageVisible(messageEl_1) && msgData['sender_id'] == openChatCompanionId)
            socket.emit('mark-msgs-as-read', [msgData['id']]);
        else {
            chatContainer.scrollTop = 0;
        }
        msgInput.value = '';
    }
});
socket.on('search-result', function (resultUsers) {
    populateWithChatItems(resultUsers, resultList);
});
socket.on('more-chat-messages-response', function (messages) {
    if (messages.length > 0) {
        var lastDivider = document.querySelector('.date-divider:last-of-type');
        if (lastDivider)
            chatScrollable.removeChild(lastDivider);
    }
    populateChatWithMessages(messages);
    thirdMessage = chatContainer.querySelector('.message:nth-last-of-type(3)');
    firstMessage = chatContainer.querySelector('.message:last-of-type');
});
socket.on('user-online-status-update', function (user) {
    var chatItem = document.querySelector(".chat-item[data-user-id='".concat(user['id'], "']"));
    if (chatItem) {
        if (user['is_online'])
            chatItem.classList.add('user-online');
        else
            chatItem.classList.remove('user-online');
    }
    if (openChatCompanionId == user['id']) {
        var companionInfo = rightPanel.querySelector('.companion-info');
        console.log('hello');
        if (user['is_online'])
            companionInfo.classList.add('user-online');
        else
            companionInfo.classList.remove('user-online');
    }
});
socket.on('companion-read-msgs', function (readMsgs) {
    chatScrollable.querySelectorAll('.my-msg.unread').forEach(function (msgEl) {
        if (readMsgs.includes(parseInt(msgEl.getAttribute('data-id')))) {
            msgEl.classList.remove('unread');
        }
    });
});
socket.on('message-deleted', function (message) {
    console.log(message);
    // if(openChatCompanionId == message.sender_id)
    var msgEl = chatScrollable.querySelector(".message[data-id= '".concat(message.id, "']"));
    if (msgEl) {
        var prevSibling = msgEl.previousSibling;
        var nextSibling = msgEl.nextSibling;
        if (nextSibling.classList.contains('date-divider')
            && (prevSibling === null || prevSibling === void 0 ? void 0 : prevSibling.classList.contains('date-divider'))) {
            chatScrollable.removeChild(nextSibling);
        }
        chatScrollable.removeChild(msgEl);
        var chatLastEl = chatScrollable.firstChild;
        if (chatLastEl.classList.contains('date-divider')) {
            chatScrollable.removeChild(chatLastEl);
        }
    }
});
function openChat(userId) {
    chatContainer.scrollTop = 0;
    socket.emit('chat_data_query', userId);
}
function addChatItem(chatUser, parentEl) {
    var fullName = chatUser['first_name'] + ' ' + chatUser['last_name'];
    var userId = chatUser['id'];
    var unreadCount = chatUser['unread_count'];
    var chatItem = document.createElement("div");
    chatItem.classList.add("chat-item");
    if (chatUser['is_online'])
        chatItem.classList.add("user-online");
    var profilePhoto = document.createElement("div");
    profilePhoto.style.backgroundImage = "url('/".concat(chatUser.id, "/profile_photo')");
    profilePhoto.classList.add("chat-item__profile-photo");
    chatItem.appendChild(profilePhoto);
    var chatUsernameWrapper = document.createElement("div");
    chatUsernameWrapper.classList.add("chat-item__username-wrapper");
    var fullname = document.createElement("span");
    fullname.textContent = fullName;
    chatUsernameWrapper.appendChild(fullname);
    chatItem.appendChild(chatUsernameWrapper);
    var unreadLabel = document.createElement("div");
    unreadLabel.classList.add("chat-item__unread-label");
    unreadLabel.textContent = unreadCount;
    chatItem.appendChild(unreadLabel);
    chatItem.setAttribute('data-user-id', userId);
    if (unreadCount == 0) {
        unreadLabel.classList.add("hidden");
        parentEl.appendChild(chatItem);
    }
    else {
        parentEl.prepend(chatItem);
    }
}
function populateWithChatItems(chatUsers, parentEl) {
    var chatItems = parentEl.querySelectorAll('.chat-item') || [];
    chatItems.forEach(function (element) {
        parentEl.removeChild(element);
    });
    if (chatUsers.length != 0) {
        chatUsers.forEach(function (chatUser) {
            addChatItem(chatUser, parentEl);
        });
    }
    else {
        var emptyLabel = parentEl.querySelector('.empty-label');
        if (emptyLabel)
            emptyLabel.classList.remove('hidden');
    }
}
function insertDateDivider(date, beforeSibling) {
    var dateDivider = document.createElement('div');
    dateDivider.classList.add('date-divider');
    var dateSpan = document.createElement('span');
    dateSpan.textContent = date;
    dateDivider.appendChild(dateSpan);
    if (!beforeSibling)
        chatScrollable.appendChild(dateDivider);
    else {
        if (beforeSibling)
            chatScrollable.insertBefore(dateDivider, beforeSibling);
    }
}
function insertMessage(message, endOfList, isNewMessage) {
    var _a;
    if (endOfList === void 0) { endOfList = false; }
    if (isNewMessage === void 0) { isNewMessage = false; }
    var utcDate = new Date(message['timestamp']);
    var threeHoursInMs = 10800000;
    var msgDate = new Date(utcDate.getTime() + threeHoursInMs); //to Ukrainian time
    var sentAt = "".concat(msgDate.getDate(), " ").concat(monthNames[msgDate.getMonth()], " ").concat(msgDate.getFullYear());
    var hours = (msgDate.getHours() >= 10) ? msgDate.getHours() : '0' + msgDate.getHours();
    var mins = (msgDate.getMinutes() > 10) ? msgDate.getMinutes() : '0' + msgDate.getMinutes();
    var sentTime = "".concat(hours, ":").concat(mins);
    if (!lastMsgSentAt[openChatCompanionId.toString()])
        lastMsgSentAt[openChatCompanionId.toString()] = sentAt;
    var messageEl = document.createElement("span");
    messageEl.classList.add("message");
    if (message['sender_id'] != openChatCompanionId) {
        messageEl.classList.add("my-msg");
    }
    messageEl.addEventListener('contextmenu', function (e) {
        var options = [];
        options.push({
            label: 'Копіювати текст',
            action: function () {
                navigator.clipboard.writeText(message['text']);
            }
        });
        if (message['sender_id'] != openChatCompanionId) {
            options.push({
                label: 'Видалити',
                action: function () {
                    socket.emit('remove-message', message['id']);
                    console.log('delete msg request: ', message['id']);
                }
            });
        }
        var menu = new ContextMenu(options, rightPanel);
        menu.show(e);
    });
    messageEl.setAttribute('data-id', message['id']);
    var messageContentEl = document.createElement('span');
    messageContentEl.textContent = message['text'];
    messageEl.appendChild(messageContentEl);
    var messageMetaWrapper = document.createElement('div');
    messageMetaWrapper.classList.add('msg-meta');
    var timeEl = document.createElement('span');
    timeEl.classList.add('sent-at-time');
    timeEl.textContent = sentTime;
    messageMetaWrapper.appendChild(timeEl);
    var deliveryStatus1 = document.createElement('img');
    var deliveryStatus2 = document.createElement('img');
    deliveryStatus1.setAttribute('src', '/static/img/check-mark.svg');
    deliveryStatus2.setAttribute('src', '/static/img/check-mark.svg');
    deliveryStatus1.classList.add('delivery-status');
    deliveryStatus2.classList.add('delivery-status-succeeded');
    // deliveryStatus2.classList.add('hidden');
    messageMetaWrapper.appendChild(deliveryStatus1);
    messageMetaWrapper.appendChild(deliveryStatus2);
    messageEl.appendChild(messageMetaWrapper);
    if (!message['read_by_recipient'])
        messageEl.classList.add('unread');
    if (sentAt != lastMsgSentAt[openChatCompanionId.toString()] && !isNewMessage /*&& chatScrollable.hasChildNodes()*/) {
        insertDateDivider(lastMsgSentAt[openChatCompanionId.toString()]);
        lastMsgSentAt[openChatCompanionId.toString()] = sentAt;
    }
    if (!endOfList)
        chatScrollable.appendChild(messageEl);
    else
        chatScrollable.insertBefore(messageEl, chatScrollable.firstChild);
    if (isNewMessage) {
        var lastDateDividerDate = (_a = chatScrollable.querySelector('.date-divider > span')) === null || _a === void 0 ? void 0 : _a.textContent;
        console.log('hello:', lastDateDividerDate);
        if (sentAt != lastDateDividerDate) {
            insertDateDivider(sentAt, messageEl.nextSibling);
        }
    }
    return messageEl;
}
function populateChatWithMessages(messages) {
    var _a;
    if (messages.length == 0) {
        (_a = chatContainer.querySelector('.message:last-of-type')) === null || _a === void 0 ? void 0 : _a.setAttribute('data-the-first-msg', 'true');
        return;
    }
    messages.forEach(function (message) {
        insertMessage(message);
    });
    insertDateDivider(lastMsgSentAt[openChatCompanionId.toString()]);
    firstMessage = chatContainer.querySelector('.message:last-of-type');
    thirdMessage = chatContainer.querySelector('.message:nth-last-of-type(3)');
}
function openUserInfoWindow(user) {
    var fullScreenContainer = document.querySelector('.full-screen-container');
    var infoWrapper = document.querySelector('.user-info_wrapper');
    var profilePhoto = fullScreenContainer === null || fullScreenContainer === void 0 ? void 0 : fullScreenContainer.querySelector('.user-info__profile-photo');
    var fullName = fullScreenContainer === null || fullScreenContainer === void 0 ? void 0 : fullScreenContainer.querySelector('.full-name');
    var username = fullScreenContainer === null || fullScreenContainer === void 0 ? void 0 : fullScreenContainer.querySelector('.username');
    profilePhoto.style.backgroundImage = "url('/".concat(user.id, "/profile_photo')");
    fullName.textContent = "".concat(user['first_name'], " ").concat(user['last_name']);
    username.textContent = '@' + user['username'];
    fullScreenContainer === null || fullScreenContainer === void 0 ? void 0 : fullScreenContainer.classList.remove('hidden');
    setTimeout(function () {
        infoWrapper === null || infoWrapper === void 0 ? void 0 : infoWrapper.classList.remove('minimized');
    }, 1);
    var sendMsgBtn = fullScreenContainer.querySelector('.user-info_send-msg-btn');
    sendMsgBtn.onclick = function () {
        console.log('helo');
        fullScreenContainer.classList.add('hidden');
        openChat(user['id']);
    };
    fullScreenContainer.addEventListener('click', function (event) {
        if (event.target !== fullScreenContainer)
            return;
        fullScreenContainer.classList.add('hidden');
        infoWrapper === null || infoWrapper === void 0 ? void 0 : infoWrapper.classList.add('minimized');
    });
}
document.querySelector('#new-message_send-button').addEventListener('click', function () {
    if (msgInput.value.length > 0) {
        socket.emit('send_message', { 'to_user_id': openChatCompanionId, 'text': msgInput.value });
        var unreadLabel = document.querySelector('.unread-msgs-section');
        if (unreadLabel)
            chatScrollable.removeChild(unreadLabel);
    }
    else {
        msgInput.classList.add('unfilled');
        setTimeout(function () {
            msgInput.classList.remove('unfilled');
        }, 150);
    }
});
msgInput.addEventListener("keyup", function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.querySelector('#new-message_send-button').click();
    }
});
searchInput.addEventListener('input', function () {
    if (searchInput.value.length == 0) {
        chatList.classList.remove('hidden');
        resultList.classList.add('hidden');
        return;
    }
    chatList.classList.add('hidden');
    resultList.classList.remove('hidden');
    socket.emit('search-event', searchInput.value);
});
var chatItemClickHandler = function (event) {
    var _a, _b, _c, _d, _e, _f;
    console.log('sent');
    var target = event.target;
    if (target.classList.contains('chat-item')) {
        openChat(parseInt(target.getAttribute('data-user-id')));
    }
    else if ((_a = target.parentElement) === null || _a === void 0 ? void 0 : _a.classList.contains('chat-item')) {
        openChat(parseInt((_b = target.parentElement) === null || _b === void 0 ? void 0 : _b.getAttribute('data-user-id')));
    }
    else if ((_d = (_c = target.parentElement) === null || _c === void 0 ? void 0 : _c.parentElement) === null || _d === void 0 ? void 0 : _d.classList.contains('chat-item')) {
        openChat(parseInt((_f = (_e = target.parentElement) === null || _e === void 0 ? void 0 : _e.parentElement) === null || _f === void 0 ? void 0 : _f.getAttribute('data-user-id')));
    }
};
chatList.addEventListener('click', chatItemClickHandler);
resultList.addEventListener('click', chatItemClickHandler);
var loadMoreMsgsQuerySent = false;
chatContainer.addEventListener('scroll', function () {
    if (!loadMoreMsgsQuerySent) {
        if (isMessageVisible(thirdMessage)) {
            if (firstMessage.getAttribute('data-the-first-msg'))
                return;
            var firstMessageId = firstMessage.getAttribute('data-id');
            socket.emit('load-more-messages', { 'companion-id': openChatCompanionId, 'start-message-id': firstMessageId });
            loadMoreMsgsQuerySent = true;
            setTimeout(function () {
                loadMoreMsgsQuerySent = false;
            }, 1000);
        }
        ;
    }
    ;
    if (chatContainer.scrollTop >= -100 && !toLastMsgBtn.classList.contains('hidden')) {
        toLastMsgBtn.classList.add('minimized');
        setTimeout(function () {
            toLastMsgBtn.classList.add('hidden');
        }, 100);
    }
    else if (chatContainer.scrollTop < -100 && toLastMsgBtn.classList.contains('hidden')) {
        toLastMsgBtn.classList.remove('hidden');
        setTimeout(function () {
            toLastMsgBtn.classList.remove('minimized');
        }, 1);
    }
});
toLastMsgBtn.addEventListener('click', function () {
    chatContainer.scrollTop = 0;
    // toLastMsgBtn.classList.add('hidden');
});
(_a = rightPanel.querySelector('.chat-exit-btn')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function () {
    var _a;
    openChatCompanionId = 0;
    (_a = document.querySelector('.left-panel')) === null || _a === void 0 ? void 0 : _a.classList.remove('hidden');
});
var observerConfig = { childList: true };
// Callback function to execute when mutations are observed
var chatListChangeCallback = function (mutationsList, observer) {
    for (var _i = 0, mutationsList_1 = mutationsList; _i < mutationsList_1.length; _i++) {
        var mutation = mutationsList_1[_i];
        var emptyLabel = mutation.target.querySelector('.empty-label');
        if (mutation.target.hasChildNodes())
            emptyLabel.classList.add('hidden');
        else
            emptyLabel.classList.remove('hidden');
    }
};
var chatListChangeObserver = new MutationObserver(chatListChangeCallback);
chatListChangeObserver.observe(chatList, observerConfig);
chatListChangeObserver.observe(resultList, observerConfig);
var lastMessage = chatContainer.querySelector('.message');
var chatChangeCallback = function (mutationsList, observer) {
    lastMessage = chatContainer.querySelector('.message');
};
var chatChangeObserver = new MutationObserver(chatChangeCallback);
chatChangeObserver.observe(chatScrollable, observerConfig);
window.onload = function () {
    searchInput.value = '';
};
//# sourceMappingURL=main.js.map