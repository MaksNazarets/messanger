import { before } from 'node:test';
import { insertNewElement, isMessageVisible, debounce } from '/static/js/custom_functions.js'
import { ContextMenu, ContextMenuOption } from './classes/ContextMenu.js';
// import io from 'socket.io-client';

type AnyObject = {
    [key: string]: any;
}
var open_chat_companion_id: number = 0;
var open_chat_companion: AnyObject;

const msg_input = document.querySelector('#new-message_input') as HTMLInputElement;
const search_input = document.querySelector('#search-input') as HTMLInputElement;
const chat_list = document.querySelector('.chat-list') as HTMLDivElement;
const result_list = document.querySelector('.result-list') as HTMLDivElement;
const chat_container = document.querySelector('.chat-container') as HTMLDivElement;
const chat_scrollable = document.querySelector('.chat-scrollable') as HTMLDivElement;
const right_panel = document.querySelector('.right-panel') as HTMLDivElement;
const to_last_msg_btn = document.querySelector('.to-last-msg-btn') as HTMLDivElement;

let last_msg_sent_at: AnyObject = {};
const month_names = ['січня', "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"]

let first_message = chat_container.querySelector('.message:last-of-type')!;
let third_message = chat_container.querySelector('.message:nth-last-of-type(3)');
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

socket.on('update_chat_list', (chat_users: []) => {
    populate_with_chat_items(chat_users, chat_list);
})

socket.on('get_chat_data', (chat_data: AnyObject) => {
    if (open_chat_companion_id != 0)
        last_msg_sent_at[open_chat_companion_id.toString()] = null;

    open_chat_companion_id = chat_data['companion']['id'];
    open_chat_companion = chat_data['companion']

    // console.log(chat_data);

    right_panel.classList.remove('hidden');

    // setting user online status
    const companion_info = right_panel.querySelector('.companion-info') as HTMLDivElement;

    if (open_chat_companion['is_online']) companion_info.classList.add('user-online');
    else companion_info.classList.remove('user-online');

    companion_info.addEventListener('click', () => {
        openUserInfoWindow(companion);
    })

    // setting companion data
    right_panel.querySelector('.chat-name__profile-photo')!.textContent = chat_data['companion']['first_name'][0];

    let companion = open_chat_companion;
    right_panel.querySelector('.chat-name__username')!.textContent = `${companion['first_name']} ${companion['last_name']}`;

    // populating chat with messages
    chat_scrollable.innerHTML = '';

    populate_chat_with_messages(chat_data['messages']);


    // Inserting 'unread' label to chat
    const unread_messages = right_panel.querySelectorAll('.message.unread') as NodeListOf<HTMLDivElement>;

    if (unread_messages.length > 0
        && !unread_messages[0].classList.contains('my-msg')) {

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

    let just_read_msgs_ids: number[] = [];
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

    // check if the media query is currently active
    if (window.innerWidth < 600) {
        console.log('The media query is currently active');
        document.querySelector('.left-panel')?.classList.add('hidden');
    }
})

socket.on('new_message', (msg_data: AnyObject) => {
    if (msg_data['sender_id'] != open_chat_companion_id
        && !msg_data['my-msg']) {

        const chat_item = document.querySelector(`.chat-item[data-user-id='${msg_data['sender_id']}']`);
        if (!chat_item) return;

        let unread_label = chat_item.querySelector('.chat-item__unread-label')!;
        if (unread_label.classList.contains('hidden')) {
            unread_label.classList.remove('hidden');
            unread_label.textContent = '1';
        }
        else {
            unread_label.textContent = (parseInt(unread_label.textContent || '0') + 1).toString();
        }
    }
    else {
        let message_el: HTMLElement = insertMessage(msg_data, true, true);
        message_el.classList.add("msg-minimized");

        setTimeout(() => {
            message_el.classList.remove("msg-minimized");
            message_el.classList.add("unread");
        }, 1);

        if (isMessageVisible(message_el) && msg_data['sender_id'] == open_chat_companion_id)
            socket.emit('mark-msgs-as-read', [msg_data['id']]);
        else {
            chat_container.scrollTop = 0;
        }

        msg_input.value = '';
    }
})

socket.on('search-result', (result_users: []) => {
    populate_with_chat_items(result_users, result_list);
})

socket.on('more-chat-messages-response', (messages: []) => {
    if (messages.length > 0) {
        const last_divider = document.querySelector('.date-divider:last-of-type')
        if (last_divider) chat_scrollable.removeChild(last_divider);
    }

    populate_chat_with_messages(messages);
    third_message = chat_container.querySelector('.message:nth-last-of-type(3)');
    first_message = chat_container.querySelector('.message:last-of-type')!;
})

socket.on('user-online-status-update', (user: AnyObject) => {
    let chat_item = document.querySelector(`.chat-item[data-user-id='${user['id']}']`)
    if (chat_item) {
        if (user['is_online']) chat_item.classList.add('user-online')
        else chat_item.classList.remove('user-online')
    }

    if (open_chat_companion_id == user['id']) {
        const companion_info = right_panel.querySelector('.companion-info')!;
        console.log('hello')
        if (user['is_online']) companion_info.classList.add('user-online')
        else companion_info.classList.remove('user-online')
    }
})

socket.on('companion-read-msgs', (read_msgs: [number]) => {
    chat_scrollable.querySelectorAll('.my-msg.unread').forEach(msg_el => {
        if (read_msgs.includes(parseInt(msg_el.getAttribute('data-id')!))) {
            msg_el.classList.remove('unread');
        }
    });
})

socket.on('message-deleted', (message: AnyObject) => {
    console.log(message);
    // if(open_chat_companion_id == message.sender_id)
    const msg_el = chat_scrollable.querySelector(`.message[data-id='${message.id}']`);
    if (msg_el) {
        const prevSibling = msg_el.previousSibling as HTMLElement;
        const nextSibling = msg_el.nextSibling as HTMLElement;

        if (nextSibling.classList.contains('date-divider')
            && prevSibling?.classList.contains('date-divider')) {

            chat_scrollable.removeChild(nextSibling);
        }

        chat_scrollable.removeChild(msg_el);

        const chatLastEl = chat_scrollable.firstChild as HTMLElement;
        if (chatLastEl.classList.contains('date-divider')) {
            chat_scrollable.removeChild(chatLastEl);
        }
    }
})

function openChat(user_id: number) {
    chat_container.scrollTop = 0;
    socket.emit('chat_data_query', user_id);
}

function addChatItem(chat_user: AnyObject, parentEl: HTMLElement) {

    let full_name = chat_user['first_name'] + ' ' + chat_user['last_name'];
    let user_id = chat_user['id'];
    let unread_count = chat_user['unread_count'];

    let chatItem = document.createElement("div");
    chatItem.classList.add("chat-item");
    if (chat_user['is_online']) chatItem.classList.add("user-online");

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

    if (unread_count == 0)
        unread_label.classList.add("hidden");

    chatItem.appendChild(unread_label);

    chatItem.setAttribute('data-user-id', user_id);

    parentEl.appendChild(chatItem);
}


function populate_with_chat_items(chat_users: [], parentEl: HTMLElement) {

    const chat_items = parentEl.querySelectorAll('.chat-item') || [];
    chat_items.forEach((element: Element) => {
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


function insertDateDivider(date: string, beforeSibling?: Element | ChildNode | null) {
    const date_divider = document.createElement('div');
    date_divider.classList.add('date-divider');
    const date_span = document.createElement('span');
    date_span.textContent = date;
    date_divider.appendChild(date_span);

    if (!beforeSibling)
        chat_scrollable.appendChild(date_divider);
    else {
        if (beforeSibling)
            chat_scrollable.insertBefore(date_divider, beforeSibling);
    }
}


function insertMessage(message: AnyObject, end_of_list = false, is_new_message = false) {
    const utc_date = new Date(message['timestamp']);
    const three_hours_in_ms = 10800000;
    const msg_date = new Date(utc_date.getTime() + three_hours_in_ms); //to Ukrainian time
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

    message_el.addEventListener('contextmenu', (e: MouseEvent) => {
        let options: ContextMenuOption[] = [];

        options.push({
            label: 'Копіювати текст',
            action: () => {
                navigator.clipboard.writeText(message['text']);
            }
        });

        if (message['sender_id'] != open_chat_companion_id) {
            options.push({
                label: 'Видалити',
                action: () => {
                    socket.emit('remove-message', message['id']);
                    console.log('delete msg request: ', message['id'])
                }
            });
        }

        const menu = new ContextMenu(options, chat_container);
        menu.show(e);
    })

    message_el.setAttribute('data-id', message['id']);
    const message_content_el = document.createElement('span');
    message_content_el.textContent = message['text']
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
        const last_date_divider_date = chat_scrollable.querySelector('.date-divider > span')?.textContent;

        console.log('hello:', last_date_divider_date);
        if (sent_at != last_date_divider_date) {
            insertDateDivider(sent_at, message_el.nextSibling);
        }
    }

    return message_el;
}


function populate_chat_with_messages(messages: []) {
    if (messages.length == 0) {
        chat_container.querySelector('.message:last-of-type')?.setAttribute('data-the-first-msg', 'true');
        return;
    }

    messages.forEach(message => {
        insertMessage(message);
    });
    insertDateDivider(last_msg_sent_at[open_chat_companion_id.toString()]);
    first_message = chat_container.querySelector('.message:last-of-type')!;
    third_message = chat_container.querySelector('.message:nth-last-of-type(3)');
}

function openUserInfoWindow(user: AnyObject) {
    const full_screen_container = document.querySelector('.full-screen-container') as HTMLElement;
    const info_wrapper = document.querySelector('.user-info_wrapper');
    const profile_photo = full_screen_container?.querySelector('.user-info__profile-photo');
    const full_name = full_screen_container?.querySelector('.full-name') as HTMLSpanElement;
    const username = full_screen_container?.querySelector('.username') as HTMLSpanElement;

    full_name.textContent = `${user['first_name']} ${user['last_name']}`;
    username.textContent = '@' + user['username'];

    full_screen_container?.classList.remove('hidden');
    setTimeout(() => {
        info_wrapper?.classList.remove('minimized');
    }, 1);

    const send_msg_btn = full_screen_container.querySelector('.user-info_send-msg-btn') as HTMLElement;

    send_msg_btn.onclick = () => {
        console.log('helo');
        full_screen_container.classList.add('hidden');
        openChat(user['id']);
    };

    full_screen_container.addEventListener('click', (event: Event) => {
        if (event.target !== full_screen_container) return;

        full_screen_container.classList.add('hidden');
        info_wrapper?.classList.add('minimized');
    });
}

document.querySelector('#new-message_send-button')!.addEventListener('click', () => {
    if (msg_input.value.length > 0) {
        socket.emit('send_message', { 'to_user_id': open_chat_companion_id, 'text': msg_input.value });

        const unread_label = document.querySelector('.unread-msgs-section');
        if (unread_label)
            chat_scrollable.removeChild(unread_label);
    }
    else {
        msg_input.classList.add('unfilled');
        setTimeout(() => {
            msg_input.classList.remove('unfilled');
        }, 150)
    }
})


msg_input.addEventListener("keyup", function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        (document.querySelector('#new-message_send-button') as HTMLButtonElement).click();
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
})

chat_list.addEventListener('click', (event: MouseEvent) => {
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
});

let load_more_msgs_query_sent = false;
chat_container.addEventListener('scroll', () => {
    if (!load_more_msgs_query_sent) {
        if (isMessageVisible(third_message)) {
            if (first_message.getAttribute('data-the-first-msg')) return;

            let first_message_id = first_message.getAttribute('data-id');
            socket.emit('load-more-messages', { 'companion-id': open_chat_companion_id, 'start-message-id': first_message_id });
            load_more_msgs_query_sent = true;

            setTimeout(() => {
                load_more_msgs_query_sent = false;
            }, 1000);
        };
    };

    if (chat_container.scrollTop >= -100 && !to_last_msg_btn.classList.contains('hidden'))
    {
        to_last_msg_btn.classList.add('minimized');
        setTimeout(() => {
            to_last_msg_btn.classList.add('hidden');
        }, 100);
    }
    else if(to_last_msg_btn.classList.contains('hidden')){
        to_last_msg_btn.classList.remove('hidden');
        setTimeout(() => {
            to_last_msg_btn.classList.remove('minimized');
        }, 1);
    }
})

to_last_msg_btn.addEventListener('click', () => {
    chat_container.scrollTop = 0;
    // to_last_msg_btn.classList.add('hidden');
});

right_panel.querySelector('.chat-exit-btn')?.addEventListener('click', () => {
    open_chat_companion_id = 0;
    document.querySelector('.left-panel')?.classList.remove('hidden');
})

const observer_config = { childList: true };

// Callback function to execute when mutations are observed
const chatListChangeCallback: MutationCallback = function (mutationsList, observer: MutationObserver) {
    for (let mutation of mutationsList) {

        let empty_label = (mutation.target as HTMLElement).querySelector('.empty-label')!;

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

const chatChangeCallback: MutationCallback = function (mutationsList, observer) {
    last_message = chat_container.querySelector('.message');
};

const chat_change_observer = new MutationObserver(chatChangeCallback);
chat_change_observer.observe(chat_scrollable, observer_config);

window.onload = () => {
    search_input.value = '';
}