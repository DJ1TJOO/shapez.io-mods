export function makeDivElement(id = null, classes = [], innerHTML = "") {
    const div = document.createElement("div");
    if (id) {
        div.id = id;
    }
    for (let i = 0; i < classes.length; ++i) {
        div.classList.add(classes[i]);
    }
    div.innerHTML = innerHTML;
    return div;
}

export function makeDivAfter(sibling, id = null, classes = [], innerHTML = "") {
    const div = makeDivElement(id, classes, innerHTML);
    if (sibling.nextElementSibling) sibling.parentNode.insertBefore(div, sibling.nextElementSibling);
    else sibling.parentNode.appendChild(div);
    return div;
}
