export function insertNewElement(tag, class_list, text_content, sibling_element = null, after = true) {
    let element = document.createElement(tag)
    for (let c of class_list) {
        element.classList.add(c);
    }

    element.textContent = text_content;
    const parent_element = sibling_element.parentElement;

    if (after)
        parent_element.appendChild(element);
    else
        parent_element.insertBefore(element, sibling_element);
}

export function isMessageVisible(message_element) {
    let messageRect = message_element.getBoundingClientRect();
    let chatDiv = document.querySelector('.chat-container');
    let chatRect = chatDiv.getBoundingClientRect();

    return (
        messageRect.top >= chatRect.top &&
        messageRect.bottom <= chatRect.bottom
    );
}

export function scrollToMessage(message) { //isn't working
    let chatDiv = document.querySelector('.chat-container');
    let chatRect = chatDiv.getBoundingClientRect();
    let messageRect = message.getBoundingClientRect();
    let scrollDistance = message.offsetTop - chatDiv.offsetTop - (chatRect.height - messageRect.height) / 2;
    chatDiv.scrollTop = (chatDiv.scrollHeight - message.offsetTop) * -1 ;
    console.log('scrollHeight: ', chatDiv.scrollHeight);
    console.log('message.offsetTop: ', message.offsetTop);
    console.log('chatDiv.scrollTop:', chatDiv.scrollTop)
}

