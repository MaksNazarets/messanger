export interface ContextMenuOption {
    label: string;
    action: () => void;
}

export class ContextMenu {
    private static currentMenu: HTMLElement | null = null;
    private options: ContextMenuOption[];
    private menu: HTMLElement | null = null;
    private backdropParent: HTMLElement | null;
    private backdrop: HTMLElement | null = null;

    constructor(options: ContextMenuOption[], backdropParent: HTMLElement | null = null) {
        this.options = options;
        this.backdropParent = backdropParent;
    }

    show(event: MouseEvent) {
        event.preventDefault();

        // Hide the current context menu if there is one
        if (ContextMenu.currentMenu) {
            this.hide();
        }

        this.menu = document.createElement('div');
        this.menu.className = 'context-menu';

        this.options.forEach((option) => {
            const item = document.createElement('div');
            item.className = 'context-menu-item';
            item.textContent = option.label;
            item.addEventListener('click', () => {
                option.action();
                this.hide();
            });
            this.menu?.appendChild(item);
        });

        document.body.appendChild(this.menu);
        this.setPosition(event.clientX, event.clientY);

        if (!this.isMenuInViewport(this.menu)) {
            const menuRect = this.menu.getBoundingClientRect();

            let newX = event.clientX, newY = event.clientY;

            const right = window.innerWidth || document.documentElement.clientHeight - menuRect.width;
            if (newX < right) newX -= this.menu.clientWidth;

            const bottom = window.innerHeight || document.documentElement.clientHeight;
            if (menuRect.bottom >= bottom) newY -= this.menu.clientHeight;

            this.setPosition(newX, newY);
        }

        if (this.backdropParent) {
            this.backdrop = document.createElement('div');
            this.backdrop.className = 'backdrop';
            this.backdropParent.appendChild(this.backdrop);
        }

        ContextMenu.currentMenu = this.menu;

        // Attach an event listener to hide the current context menu when the user clicks outside of it
        document.addEventListener('click', this.documentClickHandler);
    }

    private hide() {
        if (this.menu === ContextMenu.currentMenu && this.menu) {
            document.body.removeChild(this.menu);
            ContextMenu.currentMenu = null;
            document.removeEventListener('click', this.documentClickHandler);

            if (this.backdropParent && this.backdrop) {
                this.backdropParent?.removeChild(this.backdrop);
            }
        }
    }

    private documentClickHandler = (event: MouseEvent) => {
        this.hide();
    }
    
    private setPosition(x: number, y: number) {
        this.menu!.style.left = `${x}px`;
        this.menu!.style.top = `${y}px`;
    }

    private isMenuInViewport = (menu: HTMLElement) => {
        const rect = menu.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    };
}

