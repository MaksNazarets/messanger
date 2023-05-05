export class MediaViewer {
    constructor(mediaType, url) {
        this.mediaType = mediaType;
        this.url = url;
    }
    show() {
        if (this.mediaType === 'image') {
            this.element = document.createElement('img');
            this.element.src = this.url;
        }
        else {
            this.element = document.createElement('video');
            this.element.setAttribute('controls', 'true');
            const sourceEl = document.createElement('source');
            sourceEl.src = this.url;
            this.element.appendChild(sourceEl);
        }
        this.element.classList.add('media-viewer-content', 'minimized');
        document.body.appendChild(this.element);
        setTimeout(() => {
            this.element.classList.remove('minimized');
        }, 1);
    }
    hide() {
        document.body.removeChild(this.element);
    }
}
//# sourceMappingURL=MediaViewer.js.map