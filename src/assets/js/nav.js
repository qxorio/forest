class Menu {
    constructor(element) {
        this.menu = {
            element: element,
            brand: document.querySelector(".nav-brand"),
            toggle: document.querySelector(".menu-toggle"),
            menuLinks: document.querySelectorAll("nav#mobileNav .menu-link"),
            visible: false,
        };
        this.menu.toggle.addEventListener("click", () => this.handleMenu());
    }

    handleMenu() {
        let elem = this.menu.element;
        let links = this.menu.menuLinks;

        if (!this.menu.visible) {
            elem.classList.add("menu-visible", "move-in");
            links.forEach((link) => {
                link.classList.add("move-in");
            });
            setTimeout(() => {
                elem.classList.add("menu-move");
                links.forEach((link) => {
                    link.classList.add("change");
                });
                this.menu.toggle.classList.add("active");
                this.menu.brand.classList.add("active");
                this.menu.toggle.ariaLabel = "Close navigation menu";
                this.menu.toggle.setAttribute("aria-expanded", !this.menu.visible);
                this.menu.visible = !this.menu.visible;
            }, 100);
            setTimeout(() => {
                links.forEach((link) => {
                    link.classList.add("move-out");
                });
                elem.classList.add("move-out");

                links.forEach((link) => {
                    link.classList.remove("move-in");
                });
                elem.classList.remove("move-in");
            }, 1000);
        } else {
            links.forEach((link) => {
                link.classList.remove("change");
            });
            elem.classList.remove("menu-move");
            this.menu.toggle.classList.remove("active");
            this.menu.brand.classList.remove("active");
            this.menu.toggle.ariaLabel = "Open navigation menu";
            this.menu.toggle.ariaExpanded = (!this.menu.visible).toString();

            setTimeout(() => {
                elem.classList.remove("menu-visible", "move-out");
                links.forEach((link) => {
                    link.classList.remove("move-out");
                });
                this.menu.visible = !this.menu.visible;
            }, 1000);
        }
    }
}

const navMenu = new Menu(document.querySelector("nav#mobileNav"));
