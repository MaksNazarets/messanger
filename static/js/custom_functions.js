function insertNewElement(tag, class_list, text_content, sibling_element=null, after = true) {
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