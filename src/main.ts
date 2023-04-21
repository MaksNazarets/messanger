import { before } from 'node:test';
import { insertNewElement, isMessageVisible, debounce } from '/static/js/custom_functions.js'
import { ContextMenu, ContextMenuOption } from './classes/ContextMenu.js';
// import io from 'socket.io-client';

type AnyObject = {
    [key: string]: any;
}
let openChatCompanionId: number = 0;
let openChatCompanion: AnyObject;

const msgInput = document.querySelector('#new-message_input') as HTMLInputElement;
const searchInput = document.querySelector('#search-input') as HTMLInputElement;
const chatList = document.querySelector('.chat-list') as HTMLDivElement;
const resultList = document.querySelector('.result-list') as HTMLDivElement;
const chatContainer = document.querySelector('.chat-container') as HTMLDivElement;
const chatScrollable = document.querySelector('.chat-scrollable') as HTMLDivElement;
const rightPanel = document.querySelector('.right-panel') as HTMLDivElement;
const toLastMsgBtn = document.querySelector('.to-last-msg-btn') as HTMLDivElement;

let lastMsgSentAt: AnyObject = {};
const monthNames = ['січня', "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];

let firstMessage = chatContainer.querySelector('.message:last-of-type')!;
let thirdMessage = chatContainer.querySelector('.message:nth-last-of-type(3)');
// let currentContextMenu: ContextMenu | null = null;

let socket = io.connect('http://' + location.hostname + ':' + location.port);
socket.on('connect', () => {
    console.log('connected!');
    document.querySelector('.no-network-wrapper')?.classList.add('hidden');
});

socket.on('disconnect', () => {
    console.log('disconnected :(');
    document.querySelector('.no-network-wrapper')?.classList.remove('hidden');
});

socket.on('update_chat_list', (chatUsers: []) => {
    populateWithChatItems(chatUsers, chatList);
});

socket.on('get_chat_data', (chatData: AnyObject) => {
    if (openChatCompanionId != 0)
        lastMsgSentAt[openChatCompanionId.toString()] = null;

    openChatCompanionId = chatData['companion']['id'];
    openChatCompanion = chatData['companion'];

    console.log(chatData);

    rightPanel.classList.remove('hidden');

    // setting user online status
    const companionInfo = rightPanel.querySelector('.companion-info') as HTMLDivElement;

    if (openChatCompanion['is_online']) companionInfo.classList.add('user-online');
    else companionInfo.classList.remove('user-online');

    companionInfo.addEventListener('click', () => {
        openUserInfoWindow(companion);
    })

    // setting companion data
    const profile_photo = rightPanel.querySelector('.chat-name__profile-photo') as HTMLElement;
    profile_photo.textContent = '';
    profile_photo.style.backgroundImage = `url('/${chatData.companion.id}/profile_photo')`;

    let companion = openChatCompanion;
    rightPanel.querySelector('.chat-name__username')!.textContent = `${companion['first_name']} ${companion['last_name']}`;

    // populating chat with messages
    chatScrollable.innerHTML = '';

    populateChatWithMessages(chatData['messages']);


    // Inserting 'unread' label to chat
    const unreadMessages = rightPanel.querySelectorAll('.message.unread') as NodeListOf<HTMLDivElement>;

    if (unreadMessages.length > 0
        && !unreadMessages[0].classList.contains('my-msg')) {

        let firstUnreadMessage = unreadMessages[unreadMessages.length - 1];

        let unreadSection = document.createElement('div');
        unreadSection.classList.add('unread-msgs-section');
        unreadSection.appendChild(document.createElement('div'));

        let unreadLabel = document.createElement('span');
        unreadLabel.classList.add('unread-msgs-section-label');
        unreadLabel.textContent = 'Непрочитані повідомлення';
        unreadSection.appendChild(unreadLabel);

        unreadSection.appendChild(document.createElement('div'));

        chatScrollable.insertBefore(unreadSection, firstUnreadMessage.nextSibling);
        unreadSection.classList.remove('hidden');
    }

    let justReadMsgsIds: number[] = [];
    unreadMessages.forEach(msgEl => {
        msgEl.classList.remove('unread');
        const msgId = parseInt(msgEl.getAttribute('data-id') || '');
        if (!isNaN(msgId)) {
            justReadMsgsIds.push(msgId);
        }
    });
    socket.emit('mark-msgs-as-read', justReadMsgsIds);

    //removing unread label from chat item
    const chatItem = document.querySelector(`.chat-item[data-user-id="${openChatCompanionId}"]`);
    if (chatItem) {
        const unreadLabel = chatItem.querySelector('.chat-item__unread-label');
        if (unreadLabel)
            unreadLabel.classList.add('hidden');
    }

    // check if the media query is currently active
    if (window.innerWidth < 600) {
        console.log('The media query is currently active');
        document.querySelector('.left-panel')?.classList.add('hidden');
    }
})

socket.on('new-message', (msgData: AnyObject) => {
    if (msgData['sender_id'] != openChatCompanionId && !msgData['my-msg']) {
        const chatItem = document.querySelector(`.chat-item[data-user-id='${msgData['sender_id']}']`);
        if (!chatItem) return;

        let unreadLabel = chatItem.querySelector('.chat-item__unread-label')!;
        if (unreadLabel.classList.contains('hidden')) {
            unreadLabel.classList.remove('hidden');
            unreadLabel.textContent = '1';
        }
        else {
            unreadLabel.textContent = (parseInt(unreadLabel.textContent || '0') + 1).toString();
        }
    }
    else {
        console.log('sdaa')
        let messageEl: HTMLElement = insertMessage(msgData, true, true);
        messageEl.classList.add("msg-minimized");

        setTimeout(() => {
            messageEl.classList.remove("msg-minimized");
            messageEl.classList.add("unread");
        }, 1);

        if (isMessageVisible(messageEl) && msgData['sender_id'] == openChatCompanionId)
            socket.emit('mark-msgs-as-read', [msgData['id']]);
        else {
            chatContainer.scrollTop = 0;
        }

        msgInput.value = '';
    }
})

socket.on('search-result', (resultUsers: []) => {
    populateWithChatItems(resultUsers, resultList);
});

socket.on('more-chat-messages-response', (messages: []) => {
    if (messages.length > 0) {
        const lastDivider = document.querySelector('.date-divider:last-of-type')
        if (lastDivider) chatScrollable.removeChild(lastDivider);
    }

    populateChatWithMessages(messages);
    thirdMessage = chatContainer.querySelector('.message:nth-last-of-type(3)');
    firstMessage = chatContainer.querySelector('.message:last-of-type')!;
})

socket.on('user-online-status-update', (user: AnyObject) => {
    let chatItem = document.querySelector(`.chat-item[data-user-id='${user['id']}']`);
    if (chatItem) {
        if (user['is_online']) chatItem.classList.add('user-online');
        else chatItem.classList.remove('user-online');
    }

    if (openChatCompanionId == user['id']) {
        const companionInfo = rightPanel.querySelector('.companion-info')!;
        console.log('hello');
        if (user['is_online']) companionInfo.classList.add('user-online');
        else companionInfo.classList.remove('user-online');
    }
})

socket.on('companion-read-msgs', (readMsgs: [number]) => {
    chatScrollable.querySelectorAll('.my-msg.unread').forEach(msgEl => {
        if (readMsgs.includes(parseInt(msgEl.getAttribute('data-id')!))) {
            msgEl.classList.remove('unread');
        }
    });
});

socket.on('message-deleted', (message: AnyObject) => {
    console.log(message);
    // if(openChatCompanionId == message.sender_id)
    const msgEl = chatScrollable.querySelector(`.message[data-id= '${message.id}']`);
    if (msgEl) {
        const prevSibling = msgEl.previousSibling as HTMLElement;
        const nextSibling = msgEl.nextSibling as HTMLElement;

        if (nextSibling.classList.contains('date-divider')
            && prevSibling?.classList.contains('date-divider')) {

            chatScrollable.removeChild(nextSibling);
        }

        chatScrollable.removeChild(msgEl);

        const chatLastEl = chatScrollable.firstChild as HTMLElement;
        if (chatLastEl.classList.contains('date-divider')) {
            chatScrollable.removeChild(chatLastEl);
        }
    }
})

function openChat(userId: number) {
    chatContainer.scrollTop = 0;
    socket.emit('chat_data_query', userId);
}

function addChatItem(chatUser: AnyObject, parentEl: HTMLElement) {
    let fullName = chatUser['first_name'] + ' ' + chatUser['last_name'];
    let userId = chatUser['id'];
    let unreadCount = chatUser['unread_count'];

    let chatItem = document.createElement("div");
    chatItem.classList.add("chat-item");
    if (chatUser['is_online']) chatItem.classList.add("user-online");

    let profilePhoto = document.createElement("div");
    profilePhoto.style.backgroundImage = `url('/${chatUser.id}/profile_photo')`;
    profilePhoto.classList.add("chat-item__profile-photo");
    chatItem.appendChild(profilePhoto);

    let chatUsernameWrapper = document.createElement("div");
    chatUsernameWrapper.classList.add("chat-item__username-wrapper");

    let fullname = document.createElement("span");
    fullname.textContent = fullName;
    chatUsernameWrapper.appendChild(fullname);
    chatItem.appendChild(chatUsernameWrapper);

    let unreadLabel = document.createElement("div");
    unreadLabel.classList.add("chat-item__unread-label");
    unreadLabel.textContent = unreadCount;

    chatItem.appendChild(unreadLabel);
    chatItem.setAttribute('data-user-id', userId);

    if (unreadCount == 0){
        unreadLabel.classList.add("hidden");
        parentEl.appendChild(chatItem);
    }
    else{
        parentEl.prepend(chatItem);
    }
}


function populateWithChatItems(chatUsers: [], parentEl: HTMLElement) {
    const chatItems = parentEl.querySelectorAll('.chat-item') || [];
    chatItems.forEach((element: Element) => {
        parentEl.removeChild(element);
    });

    if (chatUsers.length != 0) {
        chatUsers.forEach(chatUser => {
            addChatItem(chatUser, parentEl);
        });
    }
    else {
        const emptyLabel = parentEl.querySelector('.empty-label');
        if (emptyLabel)
            emptyLabel.classList.remove('hidden');
    }
}


function insertDateDivider(date: string, beforeSibling?: Element | ChildNode | null) {
    const dateDivider = document.createElement('div');
    dateDivider.classList.add('date-divider');
    const dateSpan = document.createElement('span');
    dateSpan.textContent = date;
    dateDivider.appendChild(dateSpan);

    if (!beforeSibling)
        chatScrollable.appendChild(dateDivider);
    else {
        if (beforeSibling)
            chatScrollable.insertBefore(dateDivider, beforeSibling);
    }
}

function insertMessage(message: AnyObject, endOfList = false, isNewMessage = false) {
    const utcDate = new Date(message['timestamp']);
    const threeHoursInMs = 10800000;
    const msgDate = new Date(utcDate.getTime() + threeHoursInMs); //to Ukrainian time
    const sentAt = `${msgDate.getDate()} ${monthNames[msgDate.getMonth()]} ${msgDate.getFullYear()}`;

    const hours = (msgDate.getHours() >= 10) ? msgDate.getHours() : '0' + msgDate.getHours();
    const mins = (msgDate.getMinutes() > 10) ? msgDate.getMinutes() : '0' + msgDate.getMinutes();
    const sentTime = `${hours}:${mins}`;

    if (!lastMsgSentAt[openChatCompanionId.toString()])
        lastMsgSentAt[openChatCompanionId.toString()] = sentAt;

    let messageEl = document.createElement("span");
    messageEl.classList.add("message");

    if (message['sender_id'] != openChatCompanionId) {
        messageEl.classList.add("my-msg");
    }

    messageEl.addEventListener('contextmenu', (e: MouseEvent) => {
        let options: ContextMenuOption[] = [];

        options.push({
            label: 'Копіювати текст',
            action: () => {
                navigator.clipboard.writeText(message['text']);
            }
        });

        if (message['sender_id'] != openChatCompanionId) {
            options.push({
                label: 'Видалити',
                action: () => {
                    socket.emit('remove-message', message['id']);
                    console.log('delete msg request: ', message['id'])
                }
            });
        }

        const menu = new ContextMenu(options, rightPanel);
        menu.show(e);
    })

    messageEl.setAttribute('data-id', message['id']);
    const messageContentEl = document.createElement('span');
    messageContentEl.textContent = message['text']
    messageEl.appendChild(messageContentEl);

    const messageMetaWrapper = document.createElement('div');
    messageMetaWrapper.classList.add('msg-meta');
    const timeEl = document.createElement('span');
    timeEl.classList.add('sent-at-time');

    timeEl.textContent = sentTime;
    messageMetaWrapper.appendChild(timeEl);

    const deliveryStatus1 = document.createElement('img');
    const deliveryStatus2 = document.createElement('img');
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
        const lastDateDividerDate = chatScrollable.querySelector('.date-divider > span')?.textContent;

        console.log('hello:', lastDateDividerDate);
        if (sentAt != lastDateDividerDate) {
            insertDateDivider(sentAt, messageEl.nextSibling);
        }
    }

    return messageEl;
}

function populateChatWithMessages(messages: []) {
    if (messages.length == 0) {
        chatContainer.querySelector('.message:last-of-type')?.setAttribute('data-the-first-msg', 'true');
        return;
    }

    messages.forEach(message => {
        insertMessage(message);
    });
    insertDateDivider(lastMsgSentAt[openChatCompanionId.toString()]);
    firstMessage = chatContainer.querySelector('.message:last-of-type')!;
    thirdMessage = chatContainer.querySelector('.message:nth-last-of-type(3)');
}

function openUserInfoWindow(user: AnyObject) {
    const fullScreenContainer = document.querySelector('.full-screen-container') as HTMLElement;
    const infoWrapper = document.querySelector('.user-info_wrapper');
    const profilePhoto = fullScreenContainer?.querySelector('.user-info__profile-photo') as HTMLImageElement;
    const fullName = fullScreenContainer?.querySelector('.full-name') as HTMLSpanElement;
    const username = fullScreenContainer?.querySelector('.username') as HTMLSpanElement;

    profilePhoto.style.backgroundImage = `url('/${user.id}/profile_photo')`;

    fullName.textContent = `${user['first_name']} ${user['last_name']}`;
    username.textContent = '@' + user['username'];

    fullScreenContainer?.classList.remove('hidden');
    setTimeout(() => {
        infoWrapper?.classList.remove('minimized');
    }, 1);

    const sendMsgBtn = fullScreenContainer.querySelector('.user-info_send-msg-btn') as HTMLElement;

    sendMsgBtn.onclick = () => {
        console.log('helo');
        fullScreenContainer.classList.add('hidden');
        openChat(user['id']);
    };

    fullScreenContainer.addEventListener('click', (event: Event) => {
        if (event.target !== fullScreenContainer) return;

        fullScreenContainer.classList.add('hidden');
        infoWrapper?.classList.add('minimized');
    });
}

document.querySelector('#new-message_send-button')!.addEventListener('click', () => {
    if (msgInput.value.length > 0) {
        socket.emit('send_message', { 'to_user_id': openChatCompanionId, 'text': msgInput.value });

        const unreadLabel = document.querySelector('.unread-msgs-section');
        if (unreadLabel)
            chatScrollable.removeChild(unreadLabel);
    }
    else {
        msgInput.classList.add('unfilled');
        setTimeout(() => {
            msgInput.classList.remove('unfilled');
        }, 150)
    }
})

msgInput.addEventListener("keyup", function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        (document.querySelector('#new-message_send-button') as HTMLButtonElement).click();
    }
});

searchInput.addEventListener('input', () => {
    if (searchInput.value.length == 0) {
        chatList.classList.remove('hidden');
        resultList.classList.add('hidden');
        return;
    }

    chatList.classList.add('hidden');
    resultList.classList.remove('hidden');

    socket.emit('search-event', searchInput.value);
})

const chatItemClickHandler = (event: MouseEvent) => {
    console.log('sent')
    const target = event.target as HTMLDivElement;
    if (target.classList.contains('chat-item')) {
        openChat(parseInt(target.getAttribute('data-user-id')!));
    }
    else if (target.parentElement?.classList.contains('chat-item')) {
        openChat(parseInt(target.parentElement?.getAttribute('data-user-id')!));
    }
    else if (target.parentElement?.parentElement?.classList.contains('chat-item')) {
        openChat(parseInt(target.parentElement?.parentElement?.getAttribute('data-user-id')!));
    }
}

chatList.addEventListener('click', chatItemClickHandler);
resultList.addEventListener('click', chatItemClickHandler);

let loadMoreMsgsQuerySent = false;
chatContainer.addEventListener('scroll', () => {
    if (!loadMoreMsgsQuerySent) {
        if (isMessageVisible(thirdMessage)) {
            if (firstMessage.getAttribute('data-the-first-msg')) return;

            let firstMessageId = firstMessage.getAttribute('data-id');
            socket.emit('load-more-messages', { 'companion-id': openChatCompanionId, 'start-message-id': firstMessageId });
            loadMoreMsgsQuerySent = true;

            setTimeout(() => {
                loadMoreMsgsQuerySent = false;
            }, 1000);
        };
    };

    if (chatContainer.scrollTop >= -100 && !toLastMsgBtn.classList.contains('hidden')) {
        toLastMsgBtn.classList.add('minimized');
        setTimeout(() => {
            toLastMsgBtn.classList.add('hidden');
        }, 100);
    }
    else if (chatContainer.scrollTop < -100 && toLastMsgBtn.classList.contains('hidden')) {
        toLastMsgBtn.classList.remove('hidden');
        setTimeout(() => {
            toLastMsgBtn.classList.remove('minimized');
        }, 1);
    }
})

toLastMsgBtn.addEventListener('click', () => {
    chatContainer.scrollTop = 0;
    // toLastMsgBtn.classList.add('hidden');
});

rightPanel.querySelector('.chat-exit-btn')?.addEventListener('click', () => {
    openChatCompanionId = 0;
    document.querySelector('.left-panel')?.classList.remove('hidden');
})

const observerConfig = { childList: true };

// Callback function to execute when mutations are observed
const chatListChangeCallback: MutationCallback = function (mutationsList, observer: MutationObserver) {
    for (let mutation of mutationsList) {
        let emptyLabel = (mutation.target as HTMLElement).querySelector('.empty-label')!;

        if (mutation.target.hasChildNodes())
            emptyLabel.classList.add('hidden');
        else
            emptyLabel.classList.remove('hidden');
    }
};
const chatListChangeObserver = new MutationObserver(chatListChangeCallback);
chatListChangeObserver.observe(chatList, observerConfig);
chatListChangeObserver.observe(resultList, observerConfig);

let lastMessage = chatContainer.querySelector('.message');

const chatChangeCallback: MutationCallback = function (mutationsList, observer) {
    lastMessage = chatContainer.querySelector('.message');
};

const chatChangeObserver = new MutationObserver(chatChangeCallback);
chatChangeObserver.observe(chatScrollable, observerConfig);

window.onload = () => {
    searchInput.value = '';
}