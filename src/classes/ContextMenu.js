"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextMenu = void 0;
var ContextMenu = exports.ContextMenu = /** @class */ (function () {
    function ContextMenu(options, backdropParent) {
        if (backdropParent === void 0) { backdropParent = null; }
        var _this = this;
        this.menu = null;
        this.backdrop = null;
        this.documentClickHandler = function (event) {
            _this.hide();
        };
        this.isMenuInViewport = function (menu) {
            var rect = menu.getBoundingClientRect();
            return (rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth));
        };
        this.options = options;
        this.backdropParent = backdropParent;
    }
    ContextMenu.prototype.show = function (event) {
        var _this = this;
        event.preventDefault();
        // Hide the current context menu if there is one
        if (ContextMenu.currentMenu) {
            this.hide();
        }
        this.menu = document.createElement('div');
        this.menu.className = 'context-menu';
        this.options.forEach(function (option) {
            var _a;
            var item = document.createElement('div');
            item.className = 'context-menu-item';
            item.textContent = option.label;
            item.addEventListener('click', function () {
                option.action();
                _this.hide();
            });
            (_a = _this.menu) === null || _a === void 0 ? void 0 : _a.appendChild(item);
        });
        document.body.appendChild(this.menu);
        this.setPosition(event.clientX, event.clientY);
        if (!this.isMenuInViewport(this.menu)) {
            var menuRect = this.menu.getBoundingClientRect();
            var newX = event.clientX, newY = event.clientY;
            var right = window.innerWidth || document.documentElement.clientHeight - menuRect.width;
            if (newX < right)
                newX -= this.menu.clientWidth;
            var bottom = window.innerHeight || document.documentElement.clientHeight;
            if (menuRect.bottom >= bottom)
                newY -= this.menu.clientHeight;
            this.setPosition(newX, newY);
        }
        if (this.backdropParent) {
            this.backdrop = document.createElement('div');
            this.backdrop.className = 'backdrop';
            this.backdropParent.appendChild(this.backdrop);
            this.backdrop.addEventListener('contextmenu', function (e) { return e.preventDefault(); });
        }
        ContextMenu.currentMenu = this.menu;
        // Attach an event listener to hide the current context menu when the user clicks outside of it
        document.addEventListener('click', this.documentClickHandler);
    };
    ContextMenu.prototype.hide = function () {
        var _a;
        if (this.menu === ContextMenu.currentMenu && this.menu) {
            document.body.removeChild(this.menu);
            ContextMenu.currentMenu = null;
            document.removeEventListener('click', this.documentClickHandler);
            if (this.backdropParent && this.backdrop) {
                (_a = this.backdropParent) === null || _a === void 0 ? void 0 : _a.removeChild(this.backdrop);
            }
        }
    };
    ContextMenu.prototype.setPosition = function (x, y) {
        this.menu.style.left = "".concat(x, "px");
        this.menu.style.top = "".concat(y, "px");
    };
    ContextMenu.currentMenu = null;
    return ContextMenu;
}());
