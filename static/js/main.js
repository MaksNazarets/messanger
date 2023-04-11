var open_chat_companion_id = null;
var open_chat_companion;

let msg_input = document.querySelector('#new-message_input');
let search_input = document.querySelector('#search-input');
let chatList = document.querySelector('.chat-list');
let resultList = document.querySelector('.result-list');

let socket = io.connect('http://' + location.hostname + ':' + location.port);
socket.on('connect', () => {
    console.log('connected!');
});

socket.on('disconnect', () => {
    console.log('disconnected :(');
});

socket.on('update_chat_list', (chat_users) => {
    populate_with_chat_items(chat_users, chatList);
})

socket.on('get_chat_data', (chat_data) => {
    open_chat_companion_id = chat_data['companion']['id'];

    console.log(chat_data);

    let right_panel = document.querySelector('.right-panel')

    right_panel.querySelector('.chat-name__profile-photo').textContent = chat_data['companion']['first_name'][0];

    open_chat_companion = chat_data['companion']
    let companion = open_chat_companion;
    right_panel.querySelector('.chat-name__username').textContent = companion['first_name'] + ' ' + companion['last_name'];

    let chat_scrollable = right_panel.querySelector('.chat-scrollable');

    chat_scrollable.innerHTML = '';
    chat_data['messages'].forEach(message => {
        let message_el = document.createElement("span");
        message_el.classList.add("message");
        if (message['sender_id'] != companion['id']) {
            message_el.classList.add("my-msg");
        }
        message_el.textContent = message['text'];

        // TODO: Add a timestamp to message

        chat_scrollable.appendChild(message_el);
    })

    right_panel.classList.remove('hidden');
})

socket.on('new_message', (msg_data) => {
    if (msg_data['sender_id'] != open_chat_companion_id) {
        // TODO: Add an 'unread' label to sender chat
    };

    let chat_scrollable = document.querySelector('.chat-scrollable');

    let message_el = document.createElement("span");
    message_el.classList.add("message");
    message_el.classList.add("msg-minimized");
    if (msg_data['sender_id'] != open_chat_companion['id']) {
        message_el.classList.add("my-msg");
    }
    message_el.textContent = msg_data['text'];

    chat_scrollable.appendChild(message_el);

    setTimeout(() => {
        message_el.classList.remove("msg-minimized");
    }, 1);

    msg_input.value = '';
})

socket.on('search-result', (result_users) => {
    populate_with_chat_items(result_users, resultList);
})


function openChat(user_id) {
    socket.emit('chat_data_query', user_id);
}

function addChatItem(full_name, user_id, parentEl) {
    let chatItem = document.createElement("div");
    chatItem.classList.add("chat-item");

    let profilePhoto = document.createElement("div");
    profilePhoto.textContent = full_name[0];
    profilePhoto.classList.add("chat-item__profile-photo");
    chatItem.appendChild(profilePhoto);

    let chatUsernameWrapper = document.createElement("div");
    chatUsernameWrapper.classList.add("chat-item__username-wrapper");

    let fullname = document.createElement("span");
    fullname.textContent = full_name;
    chatUsernameWrapper.appendChild(fullname);
    chatItem.appendChild(chatUsernameWrapper);

    chatItem.addEventListener('click', () => {
        openChat(user_id);
    });

    parentEl.appendChild(chatItem);
}


function populate_with_chat_items(chat_users, parentEl) {
    console.log(chat_users);

    chat_items = parentEl.querySelectorAll('.chat-item')
    chat_items.forEach(element => {
        parentEl.removeChild(element);
    });

    if (chat_users.length != 0) {
        chat_users.forEach(chat_user => {
            addChatItem(chat_user['full_name'], chat_user['user_id'], parentEl);
        });
    }
    else {
        empty_label = parentEl.querySelector('.empty-label');
        empty_label.classList.remove('hidden');
    }
}


document.querySelector('#new-message_send-button').addEventListener('click', () => {
    if (msg_input.value.length > 0) {
        socket.emit('send_message', { 'to_user_id': open_chat_companion_id, 'text': msg_input.value })
    }
    else {
        msg_input.classList.add('unfilled');
        setTimeout(() => {
            msg_input.classList.remove('unfilled');
        }, 300)
    }
})


msg_input.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        document.querySelector('#new-message_send-button').click();
    }
});


search_input.addEventListener('input', () => {
    if (search_input.value.length == 0) {
        chatList.classList.remove('hidden');
        resultList.classList.add('hidden');
        return;
    }

    chatList.classList.add('hidden');
    resultList.classList.remove('hidden');

    socket.emit('search-event', search_input.value);
})


const observer_config = { childList: true };

// Callback function to execute when mutations are observed
const callback = function (mutationsList, observer) {
    for (let mutation of mutationsList) {

        let empty_label = mutation.target.querySelector('.empty-label');
        if (mutation.target.hasChildNodes())
            empty_label.classList.add('hidden');
        else
            empty_label.classList.remove('hidden');
    }
};

const observer = new MutationObserver(callback);
observer.observe(chatList, observer_config);
observer.observe(resultList, observer_config);