
(() => {
    "use strict";

    const mount = document.querySelector("#navbarMount");

    if (!mount) {
        return;
    }

    const base = document.body.dataset.base || "./";

    function normalizePath(path) {
        const clean = path.replace(/\/+/g, "/");

        if (clean.endsWith("/")) {
            return `${clean}index.html`;
        }

        return clean;
    }

    function getCurrentPage() {
        const path = normalizePath(location.pathname);

        if (path.endsWith("/about.html")) return "about";
        if (path.endsWith("/history.html")) return "history";
        if (path.endsWith("/lab.html")) return "lab";
        if (path.endsWith("/information.html")) return "information";

        return "home";
    }

    function setupNavigation() {
        const nav = mount.querySelector("#mainNav");
        const toggle = mount.querySelector("#menuToggle");
        const header = mount.querySelector("#ieumHeader");
        const currentPage = getCurrentPage();

        nav.querySelectorAll("[data-page]").forEach((link) => {
            const active = link.dataset.page === currentPage;

            link.classList.toggle("active", active);

            if (active) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });

        function closeMenu() {
            nav.classList.remove("open");
            toggle.classList.remove("open");
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "메뉴 열기");
        }

        toggle.addEventListener("click", () => {
            const opening = !nav.classList.contains("open");

            nav.classList.toggle("open", opening);
            toggle.classList.toggle("open", opening);

            toggle.setAttribute("aria-expanded", String(opening));
            toggle.setAttribute(
                "aria-label",
                opening ? "메뉴 닫기" : "메뉴 열기"
            );
        });

        nav.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", closeMenu);
        });

        document.addEventListener("click", (event) => {
            if (!header.contains(event.target)) {
                closeMenu();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeMenu();
            }
        });

        let ticking = false;

        function updateScrollState() {
            if (ticking) return;

            ticking = true;

            requestAnimationFrame(() => {
                header.classList.toggle("scrolled", window.scrollY > 12);
                ticking = false;
            });
        }

        window.addEventListener("scroll", updateScrollState, {
            passive: true
        });

        updateScrollState();
    }

    async function loadNavbar() {
        try {
            const response = await fetch(`${base}components/navbar.html`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            mount.innerHTML = await response.text();

            const links = mount.querySelectorAll(".nav-link");

            links.forEach((link) => {
                const destination = link.getAttribute("href");

                if (destination) {
                    link.href = `${base}${destination}`;
                }
            });

            const brandLink = mount.querySelector(".brand");
            const homeLink = mount.querySelector('[data-page="home"]');
            const ctaLink = mount.querySelector(".header-cta");

            if (brandLink) brandLink.href = `${base}index.html`;
            if (homeLink) homeLink.href = `${base}index.html`;
            if (ctaLink) ctaLink.href = `${base}pages/lab.html`;

            setupNavigation();
        } catch (error) {
            console.error("IEUM 상단바 로딩 실패:", error);

            mount.innerHTML = `
                <div class="navbar-error">
                    메뉴를 불러오지 못했어.
                    <button type="button" id="navbarRetry">다시 시도</button>
                </div>
            `;

            mount.querySelector("#navbarRetry")?.addEventListener(
                "click",
                loadNavbar
            );
        }
    }

    loadNavbar();
})();
