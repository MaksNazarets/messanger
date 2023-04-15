function insertNewElement(tag, class_list, text_content, sibling_element = null, after = true) {
    let element = document.createElement(tag)
    for (c of class_list) {
        element.classList.add(c);
    }

    element.textContent = text_content;
    parent_element = sibling_element.parentElement;

    if (after)
        parent_element.appendChild(element);
    else
        parent_element.insertBefore(element, sibling_element);
}

function isMessageVisible(message) {
    let messageRect = message.getBoundingClientRect();
    let chatDiv = document.querySelector('.chat-container');
    let chatRect = chatDiv.getBoundingClientRect();

    return (
        messageRect.top >= chatRect.top &&
        messageRect.bottom <= chatRect.bottom
    );
}

function scrollToMessage(message) {
    let chatDiv = document.querySelector('.chat-container');
    let chatRect = chatDiv.getBoundingClientRect();
    let messageRect = message.getBoundingClientRect();
    var scrollDistance = message.offsetTop - chatDiv.offsetTop - (chatRect.height - messageRect.height) / 2;
    chatDiv.scrollTop = (chatDiv.scrollHeight - message.offsetTop) * -1 ;
    console.log('scrollHeight: ', chatDiv.scrollHeight);
    console.log('message.offsetTop: ', message.offsetTop);
    console.log('chatDiv.scrollTop:', chatDiv.scrollTop)
}