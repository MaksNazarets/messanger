var _a;
import { isMessageVisible } from '/static/js/custom_functions.js';
import { ContextMenu } from './classes/ContextMenu.js';
var open_chat_companion_id = 0;
var open_chat_companion;
var msg_input = document.querySelector('#new-message_input');
var search_input = document.querySelector('#search-input');
var chat_list = document.querySelector('.chat-list');
var result_list = document.querySelector('.result-list');
var chat_container = document.querySelector('.chat-container');
var chat_scrollable = document.querySelector('.chat-scrollable');
var right_panel = document.querySelector('.right-panel');
var to_last_msg_btn = document.querySelector('.to-last-msg-btn');
var last_msg_sent_at = {};
var month_names = ['січня', "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
var first_message = chat_container.querySelector('.message:last-of-type');
var third_message = chat_container.querySelector('.message:nth-last-of-type(3)');
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
socket.on('update_chat_list', function (chat_users) {
    populate_with_chat_items(chat_users, chat_list);
});
socket.on('get_chat_data', function (chat_data) {
    var _a;
    if (open_chat_companion_id != 0)
        last_msg_sent_at[open_chat_companion_id.toString()] = null;
    open_chat_companion_id = chat_data['companion']['id'];
    open_chat_companion = chat_data['companion'];
    // console.log(chat_data);
    right_panel.classList.remove('hidden');
    // setting user online status
    var companion_info = right_panel.querySelector('.companion-info');
    if (open_chat_companion['is_online'])
        companion_info.classList.add('user-online');
    else
        companion_info.classList.remove('user-online');
    companion_info.addEventListener('click', function () {
        openUserInfoWindow(companion);
    });
    // setting companion data
    right_panel.querySelector('.chat-name__profile-photo').textContent = chat_data['companion']['first_name'][0];
    var companion = open_chat_companion;
    right_panel.querySelector('.chat-name__username').textContent = "".concat(companion['first_name'], " ").concat(companion['last_name']);
    // populating chat with messages
    chat_scrollable.innerHTML = '';
    populate_chat_with_messages(chat_data['messages']);
    // Inserting 'unread' label to chat
    var unread_messages = right_panel.querySelectorAll('.message.unread');
    if (unread_messages.length > 0
        && !unread_messages[0].classList.contains('my-msg')) {
        var first_unread_message = unread_messages[unread_messages.length - 1];
        var unread_section = document.createElement('div');
        unread_section.classList.add('unread-msgs-section');
        unread_section.appendChild(document.createElement('div'));
        var unread_label = document.createElement('span');
        unread_label.classList.add('unread-msgs-section-label');
        unread_label.textContent = 'Непрочитані повідомлення';
        unread_section.appendChild(unread_label);
        unread_section.appendChild(document.createElement('div'));
        chat_scrollable.insertBefore(unread_section, first_unread_message.nextSibling);
        unread_section.classList.remove('hidden');
    }
    var just_read_msgs_ids = [];
    unread_messages.forEach(function (msg_el) {
        msg_el.classList.remove('unread');
        var msg_id = parseInt(msg_el.getAttribute('data-id') || '');
        if (!isNaN(msg_id)) {
            just_read_msgs_ids.push(msg_id);
        }
    });
    socket.emit('mark-msgs-as-read', just_read_msgs_ids);
    //removing unread label from chat item
    var chat_item = document.querySelector(".chat-item[data-user-id=\"".concat(open_chat_companion_id, "\"]"));
    if (chat_item) {
        var unread_label = chat_item.querySelector('.chat-item__unread-label');
        if (unread_label)
            unread_label.classList.add('hidden');
    }
    // check if the media query is currently active
    if (window.innerWidth < 600) {
        console.log('The media query is currently active');
        (_a = document.querySelector('.left-panel')) === null || _a === void 0 ? void 0 : _a.classList.add('hidden');
    }
});
socket.on('new_message', function (msg_data) {
    if (msg_data['sender_id'] != open_chat_companion_id
        && !msg_data['my-msg']) {
        var chat_item = document.querySelector(".chat-item[data-user-id='".concat(msg_data['sender_id'], "']"));
        if (!chat_item)
            return;
        var unread_label = chat_item.querySelector('.chat-item__unread-label');
        if (unread_label.classList.contains('hidden')) {
            unread_label.classList.remove('hidden');
            unread_label.textContent = '1';
        }
        else {
            unread_label.textContent = (parseInt(unread_label.textContent || '0') + 1).toString();
        }
    }
    else {
        var message_el_1 = insertMessage(msg_data, true, true);
        message_el_1.classList.add("msg-minimized");
        setTimeout(function () {
            message_el_1.classList.remove("msg-minimized");
            message_el_1.classList.add("unread");
        }, 1);
        if (isMessageVisible(message_el_1) && msg_data['sender_id'] == open_chat_companion_id)
            socket.emit('mark-msgs-as-read', [msg_data['id']]);
        else {
            chat_container.scrollTop = 0;
        }
        msg_input.value = '';
    }
});
socket.on('search-result', function (result_users) {
    populate_with_chat_items(result_users, result_list);
});
socket.on('more-chat-messages-response', function (messages) {
    if (messages.length > 0) {
        var last_divider = document.querySelector('.date-divider:last-of-type');
        if (last_divider)
            chat_scrollable.removeChild(last_divider);
    }
    populate_chat_with_messages(messages);
    third_message = chat_container.querySelector('.message:nth-last-of-type(3)');
    first_message = chat_container.querySelector('.message:last-of-type');
});
socket.on('user-online-status-update', function (user) {
    var chat_item = document.querySelector(".chat-item[data-user-id='".concat(user['id'], "']"));
    if (chat_item) {
        if (user['is_online'])
            chat_item.classList.add('user-online');
        else
            chat_item.classList.remove('user-online');
    }
    if (open_chat_companion_id == user['id']) {
        var companion_info = right_panel.querySelector('.companion-info');
        console.log('hello');
        if (user['is_online'])
            companion_info.classList.add('user-online');
        else
            companion_info.classList.remove('user-online');
    }
});
socket.on('companion-read-msgs', function (read_msgs) {
    chat_scrollable.querySelectorAll('.my-msg.unread').forEach(function (msg_el) {
        if (read_msgs.includes(parseInt(msg_el.getAttribute('data-id')))) {
            msg_el.classList.remove('unread');
        }
    });
});
socket.on('message-deleted', function (message) {
    console.log(message);
    // if(open_chat_companion_id == message.sender_id)
    var msg_el = chat_scrollable.querySelector(".message[data-id='".concat(message.id, "']"));
    if (msg_el) {
        var prevSibling = msg_el.previousSibling;
        var nextSibling = msg_el.nextSibling;
        if (nextSibling.classList.contains('date-divider')
            && (prevSibling === null || prevSibling === void 0 ? void 0 : prevSibling.classList.contains('date-divider'))) {
            chat_scrollable.removeChild(nextSibling);
        }
        chat_scrollable.removeChild(msg_el);
        var chatLastEl = chat_scrollable.firstChild;
        if (chatLastEl.classList.contains('date-divider')) {
            chat_scrollable.removeChild(chatLastEl);
        }
    }
});
function openChat(user_id) {
    chat_container.scrollTop = 0;
    socket.emit('chat_data_query', user_id);
}
function addChatItem(chat_user, parentEl) {
    var full_name = chat_user['first_name'] + ' ' + chat_user['last_name'];
    var user_id = chat_user['id'];
    var unread_count = chat_user['unread_count'];
    var chatItem = document.createElement("div");
    chatItem.classList.add("chat-item");
    if (chat_user['is_online'])
        chatItem.classList.add("user-online");
    var profilePhoto = document.createElement("div");
    profilePhoto.textContent = full_name[0];
    profilePhoto.classList.add("chat-item__profile-photo");
    chatItem.appendChild(profilePhoto);
    var chatUsernameWrapper = document.createElement("div");
    chatUsernameWrapper.classList.add("chat-item__username-wrapper");
    var fullname = document.createElement("span");
    fullname.textContent = full_name;
    chatUsernameWrapper.appendChild(fullname);
    chatItem.appendChild(chatUsernameWrapper);
    var unread_label = document.createElement("div");
    unread_label.classList.add("chat-item__unread-label");
    unread_label.textContent = unread_count;
    if (unread_count == 0)
        unread_label.classList.add("hidden");
    chatItem.appendChild(unread_label);
    chatItem.setAttribute('data-user-id', user_id);
    parentEl.appendChild(chatItem);
}
function populate_with_chat_items(chat_users, parentEl) {
    var chat_items = parentEl.querySelectorAll('.chat-item') || [];
    chat_items.forEach(function (element) {
        parentEl.removeChild(element);
    });
    if (chat_users.length != 0) {
        chat_users.forEach(function (chat_user) {
            addChatItem(chat_user, parentEl);
        });
    }
    else {
        var empty_label = parentEl.querySelector('.empty-label');
        if (empty_label)
            empty_label.classList.remove('hidden');
    }
}
function insertDateDivider(date, beforeSibling) {
    var date_divider = document.createElement('div');
    date_divider.classList.add('date-divider');
    var date_span = document.createElement('span');
    date_span.textContent = date;
    date_divider.appendChild(date_span);
    if (!beforeSibling)
        chat_scrollable.appendChild(date_divider);
    else {
        if (beforeSibling)
            chat_scrollable.insertBefore(date_divider, beforeSibling);
    }
}
function insertMessage(message, end_of_list, is_new_message) {
    var _a;
    if (end_of_list === void 0) { end_of_list = false; }
    if (is_new_message === void 0) { is_new_message = false; }
    var utc_date = new Date(message['timestamp']);
    var three_hours_in_ms = 10800000;
    var msg_date = new Date(utc_date.getTime() + three_hours_in_ms); //to Ukrainian time
    var sent_at = "".concat(msg_date.getDate(), " ").concat(month_names[msg_date.getMonth()], " ").concat(msg_date.getFullYear());
    var hours = (msg_date.getHours() >= 10) ? msg_date.getHours() : '0' + msg_date.getHours();
    var mins = (msg_date.getMinutes() > 10) ? msg_date.getMinutes() : '0' + msg_date.getMinutes();
    var sent_time = "".concat(hours, ":").concat(mins);
    if (!last_msg_sent_at[open_chat_companion_id.toString()])
        last_msg_sent_at[open_chat_companion_id.toString()] = sent_at;
    var message_el = document.createElement("span");
    message_el.classList.add("message");
    if (message['sender_id'] != open_chat_companion_id) {
        message_el.classList.add("my-msg");
    }
    message_el.addEventListener('contextmenu', function (e) {
        var options = [];
        options.push({
            label: 'Копіювати текст',
            action: function () {
                navigator.clipboard.writeText(message['text']);
            }
        });
        if (message['sender_id'] != open_chat_companion_id) {
            options.push({
                label: 'Видалити',
                action: function () {
                    socket.emit('remove-message', message['id']);
                    console.log('delete msg request: ', message['id']);
                }
            });
        }
        var menu = new ContextMenu(options, chat_container);
        menu.show(e);
    });
    message_el.setAttribute('data-id', message['id']);
    var message_content_el = document.createElement('span');
    message_content_el.textContent = message['text'];
    message_el.appendChild(message_content_el);
    var message_meta_wrapper = document.createElement('div');
    message_meta_wrapper.classList.add('msg-meta');
    var time_el = document.createElement('span');
    time_el.classList.add('sent-at-time');
    time_el.textContent = sent_time;
    message_meta_wrapper.appendChild(time_el);
    var delivery_status_1 = document.createElement('img');
    var delivery_status_2 = document.createElement('img');
    delivery_status_1.setAttribute('src', '/static/img/check-mark.svg');
    delivery_status_2.setAttribute('src', '/static/img/check-mark.svg');
    delivery_status_1.classList.add('delivery-status');
    delivery_status_2.classList.add('delivery-status-succeeded');
    // delivery_status_2.classList.add('hidden');
    message_meta_wrapper.appendChild(delivery_status_1);
    message_meta_wrapper.appendChild(delivery_status_2);
    message_el.appendChild(message_meta_wrapper);
    if (!message['read_by_recipient'])
        message_el.classList.add('unread');
    if (sent_at != last_msg_sent_at[open_chat_companion_id.toString()] && !is_new_message /*&& chat_scrollable.hasChildNodes()*/) {
        insertDateDivider(last_msg_sent_at[open_chat_companion_id.toString()]);
        last_msg_sent_at[open_chat_companion_id.toString()] = sent_at;
    }
    if (!end_of_list)
        chat_scrollable.appendChild(message_el);
    else
        chat_scrollable.insertBefore(message_el, chat_scrollable.firstChild);
    if (is_new_message) {
        var last_date_divider_date = (_a = chat_scrollable.querySelector('.date-divider > span')) === null || _a === void 0 ? void 0 : _a.textContent;
        console.log('hello:', last_date_divider_date);
        if (sent_at != last_date_divider_date) {
            insertDateDivider(sent_at, message_el.nextSibling);
        }
    }
    return message_el;
}
function populate_chat_with_messages(messages) {
    var _a;
    if (messages.length == 0) {
        (_a = chat_container.querySelector('.message:last-of-type')) === null || _a === void 0 ? void 0 : _a.setAttribute('data-the-first-msg', 'true');
        return;
    }
    messages.forEach(function (message) {
        insertMessage(message);
    });
    insertDateDivider(last_msg_sent_at[open_chat_companion_id.toString()]);
    first_message = chat_container.querySelector('.message:last-of-type');
    third_message = chat_container.querySelector('.message:nth-last-of-type(3)');
}
function openUserInfoWindow(user) {
    var full_screen_container = document.querySelector('.full-screen-container');
    var info_wrapper = document.querySelector('.user-info_wrapper');
    var profile_photo = full_screen_container === null || full_screen_container === void 0 ? void 0 : full_screen_container.querySelector('.user-info__profile-photo');
    var full_name = full_screen_container === null || full_screen_container === void 0 ? void 0 : full_screen_container.querySelector('.full-name');
    var username = full_screen_container === null || full_screen_container === void 0 ? void 0 : full_screen_container.querySelector('.username');
    full_name.textContent = "".concat(user['first_name'], " ").concat(user['last_name']);
    username.textContent = '@' + user['username'];
    full_screen_container === null || full_screen_container === void 0 ? void 0 : full_screen_container.classList.remove('hidden');
    setTimeout(function () {
        info_wrapper === null || info_wrapper === void 0 ? void 0 : info_wrapper.classList.remove('minimized');
    }, 1);
    var send_msg_btn = full_screen_container.querySelector('.user-info_send-msg-btn');
    send_msg_btn.onclick = function () {
        console.log('helo');
        full_screen_container.classList.add('hidden');
        openChat(user['id']);
    };
    full_screen_container.addEventListener('click', function (event) {
        if (event.target !== full_screen_container)
            return;
        full_screen_container.classList.add('hidden');
        info_wrapper === null || info_wrapper === void 0 ? void 0 : info_wrapper.classList.add('minimized');
    });
}
document.querySelector('#new-message_send-button').addEventListener('click', function () {
    if (msg_input.value.length > 0) {
        socket.emit('send_message', { 'to_user_id': open_chat_companion_id, 'text': msg_input.value });
        var unread_label = document.querySelector('.unread-msgs-section');
        if (unread_label)
            chat_scrollable.removeChild(unread_label);
    }
    else {
        msg_input.classList.add('unfilled');
        setTimeout(function () {
            msg_input.classList.remove('unfilled');
        }, 150);
    }
});
msg_input.addEventListener("keyup", function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.querySelector('#new-message_send-button').click();
    }
});
search_input.addEventListener('input', function () {
    if (search_input.value.length == 0) {
        chat_list.classList.remove('hidden');
        result_list.classList.add('hidden');
        return;
    }
    chat_list.classList.add('hidden');
    result_list.classList.remove('hidden');
    socket.emit('search-event', search_input.value);
});
chat_list.addEventListener('click', function (event) {
    var _a, _b, _c, _d, _e, _f;
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
});
var load_more_msgs_query_sent = false;
chat_container.addEventListener('scroll', function () {
    if (!load_more_msgs_query_sent) {
        if (isMessageVisible(third_message)) {
            if (first_message.getAttribute('data-the-first-msg'))
                return;
            var first_message_id = first_message.getAttribute('data-id');
            socket.emit('load-more-messages', { 'companion-id': open_chat_companion_id, 'start-message-id': first_message_id });
            load_more_msgs_query_sent = true;
            setTimeout(function () {
                load_more_msgs_query_sent = false;
            }, 1000);
        }
        ;
    }
    ;
    if (chat_container.scrollTop >= -100 && !to_last_msg_btn.classList.contains('hidden')) {
        to_last_msg_btn.classList.add('minimized');
        setTimeout(function () {
            to_last_msg_btn.classList.add('hidden');
        }, 100);
    }
    else if (to_last_msg_btn.classList.contains('hidden')) {
        to_last_msg_btn.classList.remove('hidden');
        setTimeout(function () {
            to_last_msg_btn.classList.remove('minimized');
        }, 1);
    }
});
to_last_msg_btn.addEventListener('click', function () {
    chat_container.scrollTop = 0;
    // to_last_msg_btn.classList.add('hidden');
});
(_a = right_panel.querySelector('.chat-exit-btn')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function () {
    var _a;
    open_chat_companion_id = 0;
    (_a = document.querySelector('.left-panel')) === null || _a === void 0 ? void 0 : _a.classList.remove('hidden');
});
var observer_config = { childList: true };
// Callback function to execute when mutations are observed
var chatListChangeCallback = function (mutationsList, observer) {
    for (var _i = 0, mutationsList_1 = mutationsList; _i < mutationsList_1.length; _i++) {
        var mutation = mutationsList_1[_i];
        var empty_label = mutation.target.querySelector('.empty-label');
        if (mutation.target.hasChildNodes())
            empty_label.classList.add('hidden');
        else
            empty_label.classList.remove('hidden');
    }
};
var chat_list_change_observer = new MutationObserver(chatListChangeCallback);
chat_list_change_observer.observe(chat_list, observer_config);
chat_list_change_observer.observe(result_list, observer_config);
var last_message = chat_container.querySelector('.message');
var chatChangeCallback = function (mutationsList, observer) {
    last_message = chat_container.querySelector('.message');
};
var chat_change_observer = new MutationObserver(chatChangeCallback);
chat_change_observer.observe(chat_scrollable, observer_config);
window.onload = function () {
    search_input.value = '';
};
//# sourceMappingURL=main.js.map