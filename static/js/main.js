import { isMessageVisible } from '/static/js/custom_functions.js';
var open_chat_companion_id = 0;
var open_chat_companion;
const msg_input = document.querySelector('#new-message_input');
const search_input = document.querySelector('#search-input');
const chat_list = document.querySelector('.chat-list');
const result_list = document.querySelector('.result-list');
const chat_container = document.querySelector('.chat-container');
const chat_scrollable = document.querySelector('.chat-scrollable');
const right_panel = document.querySelector('.right-panel');
const to_last_msg_btn = document.querySelector('.to-last-msg-btn');
let last_msg_sent_at = {};
const month_names = ['січня', "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
let socket = io.connect('http://' + location.hostname + ':' + location.port);
socket.on('connect', () => {
    console.log('connected!');
});
socket.on('disconnect', () => {
    console.log('disconnected :(');
});
socket.on('update_chat_list', (chat_users) => {
    populate_with_chat_items(chat_users, chat_list);
});
socket.on('get_chat_data', (chat_data) => {
    if (open_chat_companion_id != 0)
        last_msg_sent_at[open_chat_companion_id.toString()] = null;
    open_chat_companion_id = chat_data['companion']['id'];
    open_chat_companion = chat_data['companion'];
    // console.log(chat_data);
    right_panel.classList.remove('hidden');
    // setting user online status
    const chat_name_wrapper = right_panel.querySelector('.chat-name_wrapper');
    if (open_chat_companion['is_online'])
        chat_name_wrapper.classList.add('user-online');
    else
        chat_name_wrapper.classList.remove('user-online');
    // setting companion data
    right_panel.querySelector('.chat-name__profile-photo').textContent = chat_data['companion']['first_name'][0];
    let companion = open_chat_companion;
    right_panel.querySelector('.chat-name__username').textContent = companion['first_name'] + ' ' + companion['last_name'];
    // populating chat with messages
    chat_scrollable.innerHTML = '';
    populate_chat_with_messages(chat_data['messages']);
    // Inserting 'unread' label to chat
    const unread_messages = right_panel.querySelectorAll('.message.unread');
    if (unread_messages.length > 0) {
        if (unread_messages[0].classList.contains('my-msg'))
            return;
        let first_unread_message = unread_messages[unread_messages.length - 1];
        let unread_section = document.createElement('div');
        unread_section.classList.add('unread-msgs-section');
        unread_section.appendChild(document.createElement('div'));
        let unread_label = document.createElement('span');
        unread_label.classList.add('unread-msgs-section-label');
        unread_label.textContent = 'Непрочитані повідомлення';
        unread_section.appendChild(unread_label);
        unread_section.appendChild(document.createElement('div'));
        chat_scrollable.insertBefore(unread_section, first_unread_message.nextSibling);
        unread_section.classList.remove('hidden');
    }
    let just_read_msgs_ids = [];
    unread_messages.forEach(msg_el => {
        msg_el.classList.remove('unread');
        const msg_id = parseInt(msg_el.getAttribute('data-id') || '');
        if (!isNaN(msg_id)) {
            just_read_msgs_ids.push(msg_id);
        }
    });
    socket.emit('mark-msgs-as-read', just_read_msgs_ids);
    //removing unread label from chat item
    const chat_item = document.querySelector(`.chat-item[data-user-id="${open_chat_companion_id}"]`);
    if (chat_item) {
        const unread_label = chat_item.querySelector('.chat-item__unread-label');
        if (unread_label)
            unread_label.classList.add('hidden');
    }
});
socket.on('new_message', (msg_data) => {
    if (msg_data['sender_id'] != open_chat_companion_id
        && !msg_data['my-msg']) {
        const chat_item = document.querySelector(`.chat-item[data-user-id='${msg_data['sender_id']}']`);
        if (!chat_item)
            return;
        let unread_label = chat_item.querySelector('.chat-item__unread-label');
        if (unread_label.classList.contains('hidden')) {
            unread_label.classList.remove('hidden');
            unread_label.textContent = '1';
        }
        else {
            unread_label.textContent = (parseInt(unread_label.textContent || '0') + 1).toString();
        }
    }
    else {
        const message_el = document.createElement("span");
        message_el.classList.add("message");
        message_el.classList.add("msg-minimized");
        if (msg_data['sender_id'] != open_chat_companion_id) {
            message_el.classList.add("my-msg");
        }
        message_el.setAttribute('data-id', msg_data['id']);
        message_el.textContent = msg_data['text'];
        if (msg_data['sender_id'] == open_chat_companion_id || msg_data['my-msg']) {
            const last_msg = chat_scrollable.querySelector('.message');
            const utc_date = new Date(msg_data['timestamp']);
            const three_hours_in_ms = 10800000;
            const msg_date = new Date(utc_date.getTime() + three_hours_in_ms); //to Ukrainian time
            const sent_at = `${msg_date.getDate()} ${month_names[msg_date.getMonth()]} ${msg_date.getFullYear()}`;
            chat_scrollable.insertBefore(message_el, last_msg);
            if (sent_at != last_msg_sent_at[open_chat_companion_id.toString()]) {
                console.log(sent_at);
                last_msg_sent_at[open_chat_companion_id.toString()] = sent_at;
                insertDateDivider(true, last_msg);
            }
        }
        if (msg_data['sender_id'] == open_chat_companion_id)
            // if (isMessageVisible(message_el))
            socket.emit('mark-msgs-as-read', [message_el.getAttribute('data-id')]);
        setTimeout(() => {
            message_el.classList.remove("msg-minimized");
        }, 1);
        msg_input.value = '';
    }
});
socket.on('search-result', (result_users) => {
    populate_with_chat_items(result_users, result_list);
});
socket.on('more-chat-messages-response', (messages) => {
    if (messages.length > 0) {
        const last_divider = document.querySelector('.date-divider:last-of-type');
        if (last_divider)
            chat_scrollable.removeChild(last_divider);
    }
    populate_chat_with_messages(messages);
});
socket.on('user-online-status-update', (user) => {
    let chat_item = document.querySelector(`.chat-item[data-user-id='${user['id']}']`);
    if (chat_item) {
        if (user['is_online'])
            chat_item.classList.add('user-online');
        else
            chat_item.classList.remove('user-online');
    }
    if (open_chat_companion_id == user['id']) {
        const chat_name_wrapper = right_panel.querySelector('.chat-name_wrapper');
        console.log('hello');
        if (user['is_online'])
            chat_name_wrapper.classList.add('user-online');
        else
            chat_name_wrapper.classList.remove('user-online');
    }
});
function openChat(user_id) {
    socket.emit('chat_data_query', user_id);
}
function addChatItem(chat_user, parentEl) {
    let full_name = chat_user['first_name'] + ' ' + chat_user['last_name'];
    let user_id = chat_user['id'];
    let unread_count = chat_user['unread_count'];
    let chatItem = document.createElement("div");
    chatItem.classList.add("chat-item");
    if (chat_user['is_online'])
        chatItem.classList.add("user-online");
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
    let unread_label = document.createElement("div");
    unread_label.classList.add("chat-item__unread-label");
    unread_label.textContent = unread_count;
    console.log(unread_count);
    if (unread_count == 0 /*|| !unread_count*/)
        unread_label.classList.add("hidden");
    chatItem.appendChild(unread_label);
    chatItem.setAttribute('data-user-id', user_id);
    chatItem.addEventListener('click', () => {
        openChat(user_id);
    });
    parentEl.appendChild(chatItem);
}
function populate_with_chat_items(chat_users, parentEl) {
    const chat_items = parentEl.querySelectorAll('.chat-item') || [];
    chat_items.forEach((element) => {
        parentEl.removeChild(element);
    });
    if (chat_users.length != 0) {
        chat_users.forEach(chat_user => {
            addChatItem(chat_user, parentEl);
        });
    }
    else {
        const empty_label = parentEl.querySelector('.empty-label');
        if (empty_label)
            empty_label.classList.remove('hidden');
    }
}
function populate_chat_with_messages(messages) {
    if (messages.length == 0) {
        chat_container.querySelector('.message:last-of-type')?.setAttribute('data-the-first-msg', 'true');
        return;
    }
    let month_names = ['січня', "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
    messages.forEach(message => {
        const utc_date = new Date(message['timestamp']);
        const three_hours_in_ms = 10800000;
        const msg_date = new Date(utc_date.getTime() + three_hours_in_ms); //to Ukrainian time
        console.log(msg_date);
        const sent_at = `${msg_date.getDate()} ${month_names[msg_date.getMonth()]} ${msg_date.getFullYear()}`;
        const hours = (msg_date.getHours() >= 10) ? msg_date.getHours() : '0' + msg_date.getHours();
        const mins = (msg_date.getMinutes() > 10) ? msg_date.getMinutes() : '0' + msg_date.getMinutes();
        const sent_time = `${hours}:${mins}`;
        if (!last_msg_sent_at[open_chat_companion_id.toString()])
            last_msg_sent_at[open_chat_companion_id.toString()] = sent_at;
        let message_el = document.createElement("span");
        message_el.classList.add("message");
        if (message['sender_id'] != open_chat_companion_id) {
            message_el.classList.add("my-msg");
        }
        message_el.setAttribute('data-id', message['id']);
        const message_content_el = document.createElement('span');
        message_content_el.textContent = message['text'];
        message_el.appendChild(message_content_el);
        const message_meta_wrapper = document.createElement('div');
        message_meta_wrapper.classList.add('msg-meta');
        const time_el = document.createElement('span');
        time_el.classList.add('sent-at-time');
        time_el.textContent = sent_time;
        message_meta_wrapper.appendChild(time_el);
        const delivery_status_1 = document.createElement('img');
        const delivery_status_2 = document.createElement('img');
        delivery_status_1.setAttribute('src', '/static/img/check-mark.svg');
        delivery_status_2.setAttribute('src', '/static/img/check-mark.svg');
        delivery_status_1.classList.add('delivery-status');
        delivery_status_2.classList.add('delivery-status-succeeded');
        delivery_status_2.classList.add('hidden');
        message_meta_wrapper.appendChild(delivery_status_1);
        message_meta_wrapper.appendChild(delivery_status_2);
        message_el.appendChild(message_meta_wrapper);
        if (!message['read_by_recipient'])
            message_el.classList.add('unread');
        if (sent_at != last_msg_sent_at[open_chat_companion_id.toString()] && chat_scrollable.hasChildNodes()) {
            insertDateDivider();
            last_msg_sent_at[open_chat_companion_id.toString()] = sent_at;
        }
        chat_scrollable.appendChild(message_el);
    });
    insertDateDivider();
}
function insertDateDivider(before = false, beforeSibling) {
    const date_divider = document.createElement('div');
    date_divider.classList.add('date-divider');
    const date = document.createElement('span');
    date.textContent = last_msg_sent_at[open_chat_companion_id.toString()];
    date_divider.appendChild(date);
    if (!before)
        chat_scrollable.appendChild(date_divider);
    else {
        if (beforeSibling)
            chat_scrollable.insertBefore(date_divider, beforeSibling);
    }
}
document.querySelector('#new-message_send-button').addEventListener('click', () => {
    if (msg_input.value.length > 0) {
        socket.emit('send_message', { 'to_user_id': open_chat_companion_id, 'text': msg_input.value });
        let unread_label = document.querySelector('.unread-msgs-section');
        if (unread_label)
            chat_scrollable.removeChild(unread_label);
    }
    else {
        msg_input.classList.add('unfilled');
        setTimeout(() => {
            msg_input.classList.remove('unfilled');
        }, 300);
    }
});
msg_input.addEventListener("keyup", function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.querySelector('#new-message_send-button').click();
    }
});
search_input.addEventListener('input', () => {
    if (search_input.value.length == 0) {
        chat_list.classList.remove('hidden');
        result_list.classList.add('hidden');
        return;
    }
    chat_list.classList.add('hidden');
    result_list.classList.remove('hidden');
    socket.emit('search-event', search_input.value);
});
let load_more_msgs_query_sent = false;
chat_container.addEventListener('scroll', () => {
    if (!load_more_msgs_query_sent) {
        let third_message = chat_container.querySelector('.message:nth-last-of-type(3)');
        if (isMessageVisible(third_message)) {
            const first_message = chat_container.querySelector('.message:last-of-type');
            if (first_message.getAttribute('data-the-first-msg'))
                return;
            let first_message_id = first_message.getAttribute('data-id');
            socket.emit('load-more-messages', { 'companion-id': open_chat_companion_id, 'start-message-id': first_message_id });
            load_more_msgs_query_sent = true;
            setTimeout(() => {
                load_more_msgs_query_sent = false;
            }, 5000);
        }
        ;
        // ### For now working bad
        // console.log(isMessageVisible(last_message))
        // if(!isMessageVisible(last_message))
        //     to_last_msg_btn.classList.remove('hidden');
        // else
        //     to_last_msg_btn.classList.add('hidden');
    }
    ;
});
to_last_msg_btn.addEventListener('click', () => {
    chat_container.scrollTop = 0;
    to_last_msg_btn.classList.add('hidden');
});
const observer_config = { childList: true };
// Callback function to execute when mutations are observed
const chatListChangeCallback = function (mutationsList, observer) {
    for (let mutation of mutationsList) {
        let empty_label = mutation.target.querySelector('.empty-label');
        if (mutation.target.hasChildNodes())
            empty_label.classList.add('hidden');
        else
            empty_label.classList.remove('hidden');
    }
};
const chat_list_change_observer = new MutationObserver(chatListChangeCallback);
chat_list_change_observer.observe(chat_list, observer_config);
chat_list_change_observer.observe(result_list, observer_config);
let last_message = chat_container.querySelector('.message');
const chatChangeCallback = function (mutationsList, observer) {
    last_message = chat_container.querySelector('.message');
};
const chat_change_observer = new MutationObserver(chatChangeCallback);
chat_change_observer.observe(chat_scrollable, observer_config);
//# sourceMappingURL=main.js.map