
(() => {
    "use strict";

    const mount = document.querySelector("#navbarMount");

    if (!mount) {
        return;
    }

    const base = document.body.dataset.base || "";

    fetch(`${base}components/navbar.html`)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Navbar load failed: ${response.status}`);
            }

            return response.text();
        })
        .then((html) => {
            mount.innerHTML = html;

            const currentPath = location.pathname;
            const links = mount.querySelectorAll("[data-page]");

            links.forEach((link) => {
                const href = new URL(link.href, location.href).pathname;
                const isHome =
                    link.dataset.page === "home" &&
                    currentPath.endsWith("/index.html");

                if (href === currentPath || isHome) {
                    link.classList.add("active");
                    link.setAttribute("aria-current", "page");
                }
            });

            const menuButton = mount.querySelector("#menuToggle");
            const nav = mount.querySelector("#mainNav");

            menuButton?.addEventListener("click", () => {
                const isOpen = nav.classList.toggle("open");

                menuButton.setAttribute(
                    "aria-expanded",
                    String(isOpen)
                );

                menuButton.setAttribute(
                    "aria-label",
                    isOpen ? "메뉴 닫기" : "메뉴 열기"
                );
            });

            nav?.querySelectorAll("a").forEach((link) => {
                link.addEventListener("click", () => {
                    nav.classList.remove("open");
                    menuButton?.setAttribute("aria-expanded", "false");
                });
            });
        })
        .catch((error) => {
            console.error("IEUM navbar:", error);
            mount.textContent = "메뉴를 불러오지 못했어. 페이지를 새로고침해 봐.";
        });
})();
