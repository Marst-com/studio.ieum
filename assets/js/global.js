
"use strict";

/* ========================================
   IEUM PLAYGROUND — GLOBAL CONTROLLER
   ======================================== */

const IEUM = (() => {
    const STORAGE_PREFIX = "ieum-playground:";

    let toastTimer = null;

    /* ------------------------------------
       DOM helpers
    ------------------------------------ */

    function $(selector, parent = document) {
        return parent.querySelector(selector);
    }

    function $$(selector, parent = document) {
        return [...parent.querySelectorAll(selector)];
    }

    /* ------------------------------------
       Toast notifications
    ------------------------------------ */

    function toast(message, duration = 2600) {
        const element = $("#toast");

        if (!element) {
            console.log("[IEUM]", message);
            return;
        }

        element.textContent = String(message);
        element.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            element.classList.remove("show");
        }, duration);
    }

    /* ------------------------------------
       Mobile navigation
    ------------------------------------ */

    function initNavigation() {
        const menuButton = $("#menuToggle");
        const navigation = $("#mainNav");

        if (!menuButton || !navigation) {
            return;
        }

        function closeMenu() {
            navigation.classList.remove("open");

            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );

            menuButton.setAttribute(
                "aria-label",
                "메뉴 열기"
            );

            menuButton.textContent = "☰";
        }

        function toggleMenu() {
            const isOpen =
                navigation.classList.toggle("open");

            menuButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

            menuButton.setAttribute(
                "aria-label",
                isOpen ? "메뉴 닫기" : "메뉴 열기"
            );

            menuButton.textContent =
                isOpen ? "✕" : "☰";
        }

        menuButton.addEventListener(
            "click",
            toggleMenu
        );

        $$(".nav-link", navigation).forEach(link => {
            link.addEventListener("click", closeMenu);
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                closeMenu();
            }
        });

        document.addEventListener("click", event => {
            if (
                !navigation.contains(event.target) &&
                !menuButton.contains(event.target)
            ) {
                closeMenu();
            }
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 720) {
                closeMenu();
            }
        });
    }

    /* ------------------------------------
       Current page navigation
    ------------------------------------ */

    function initActiveNavigation() {
        const currentPath = location.pathname
            .replace(/\/+$/, "")
            .toLowerCase();

        $$(".nav-link").forEach(link => {
            const linkUrl = new URL(
                link.href,
                location.href
            );

            const linkPath = linkUrl.pathname
                .replace(/\/+$/, "")
                .toLowerCase();

            const isHome =
                currentPath === "" ||
                currentPath.endsWith("/index.html");

            const isLinkHome =
                linkPath === "" ||
                linkPath.endsWith("/index.html");

            const active = isHome
                ? isLinkHome
                : currentPath === linkPath;

            link.classList.toggle("active", active);

            if (active) {
                link.setAttribute(
                    "aria-current",
                    "page"
                );
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }

    /* ------------------------------------
       Footer year
    ------------------------------------ */

    function initFooter() {
        const year = $("#year");

        if (year) {
            year.textContent =
                new Date().getFullYear();
        }
    }

    /* ------------------------------------
       Safe local storage
    ------------------------------------ */

    function storageKey(name) {
        return STORAGE_PREFIX + name;
    }

    function get(name, fallback = null) {
        try {
            const value = localStorage.getItem(
                storageKey(name)
            );

            return value === null
                ? fallback
                : JSON.parse(value);
        } catch (error) {
            console.warn(
                "[IEUM] 저장된 데이터를 읽지 못했어.",
                error
            );

            return fallback;
        }
    }

    function set(name, value) {
        try {
            localStorage.setItem(
                storageKey(name),
                JSON.stringify(value)
            );

            return true;
        } catch (error) {
            console.warn(
                "[IEUM] 데이터를 저장하지 못했어.",
                error
            );

            toast(
                "저장 공간에 접근할 수 없어. 브라우저 설정을 확인해 줘."
            );

            return false;
        }
    }

    function remove(name) {
        try {
            localStorage.removeItem(
                storageKey(name)
            );

            return true;
        } catch {
            return false;
        }
    }

    /* ------------------------------------
       Copy to clipboard
    ------------------------------------ */

    async function copy(text) {
        const value = String(text);

        try {
            await navigator.clipboard.writeText(value);

            toast("클립보드에 복사했어!");
            return true;
        } catch {
            const textarea =
                document.createElement("textarea");

            textarea.value = value;

            textarea.style.position = "fixed";
            textarea.style.opacity = "0";

            document.body.appendChild(textarea);

            textarea.select();

            let success = false;

            try {
                success = document.execCommand("copy");
            } catch {
                success = false;
            }

            textarea.remove();

            toast(
                success
                    ? "클립보드에 복사했어!"
                    : "복사에 실패했어. 직접 선택해서 복사해 줘."
            );

            return success;
        }
    }

    /* ------------------------------------
       Button loading state
    ------------------------------------ */

    function setLoading(button, loading, text = "처리 중...") {
        if (!button) {
            return;
        }

        if (loading) {
            if (!button.dataset.originalText) {
                button.dataset.originalText =
                    button.textContent;
            }

            button.disabled = true;
            button.textContent = text;
        } else {
            button.disabled = false;

            if (button.dataset.originalText) {
                button.textContent =
                    button.dataset.originalText;

                delete button.dataset.originalText;
            }
        }
    }

    /* ------------------------------------
       Scroll reveal
    ------------------------------------ */

    function initReveal() {
        const elements = $$("[data-reveal]");

        if (
            !elements.length ||
            !("IntersectionObserver" in window)
        ) {
            elements.forEach(element => {
                element.classList.add("revealed");
            });

            return;
        }

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(
                            "revealed"
                        );

                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.12
            }
        );

        elements.forEach(element => {
            observer.observe(element);
        });
    }

    /* ------------------------------------
       Search filtering
    ------------------------------------ */

    function initSearch() {
        const searchInputs = $$("[data-search-input]");

        searchInputs.forEach(input => {
            const targetSelector =
                input.dataset.searchTarget;

            if (!targetSelector) {
                return;
            }

            input.addEventListener("input", () => {
                const query = input.value
                    .trim()
                    .toLowerCase();

                const targets = $$(targetSelector);

                let visibleCount = 0;

                targets.forEach(target => {
                    const content = (
                        target.textContent || ""
                    ).toLowerCase();

                    const matches =
                        content.includes(query);

                    target.hidden = !matches;

                    if (matches) {
                        visibleCount++;
                    }
                });

                const countElement = $(
                    input.dataset.searchCount || ""
                );

                if (countElement) {
                    countElement.textContent =
                        `${visibleCount}개 결과`;
                }
            });
        });
    }

    /* ------------------------------------
       External link protection
    ------------------------------------ */

    function initExternalLinks() {
        $$('a[target="_blank"]').forEach(link => {
            const rel = new Set(
                (link.getAttribute("rel") || "")
                    .split(/\s+/)
                    .filter(Boolean)
            );

            rel.add("noopener");
            rel.add("noreferrer");

            link.setAttribute(
                "rel",
                [...rel].join(" ")
            );
        });
    }

    /* ------------------------------------
       Keyboard shortcuts
    ------------------------------------ */

    function initKeyboardShortcuts() {
        document.addEventListener("keydown", event => {
            const target = event.target;

            const isTyping =
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement ||
                target?.isContentEditable;

            if (isTyping || event.altKey || event.ctrlKey ||
                event.metaKey) {
                return;
            }

            if (event.key === "/") {
                const search = $(
                    "[data-search-input]"
                );

                if (search) {
                    event.preventDefault();
                    search.focus();
                }
            }

            if (event.key === "Escape") {
                const search = $(
                    "[data-search-input]"
                );

                if (search && document.activeElement === search) {
                    search.blur();
                }
            }
        });
    }

    /* ------------------------------------
       Initialize
    ------------------------------------ */

    function init() {
        initNavigation();
        initActiveNavigation();
        initFooter();
        initReveal();
        initSearch();
        initExternalLinks();
        initKeyboardShortcuts();

        console.log(
            "%cIEUM Playground",
            "color:#a78bfa;font-size:18px;font-weight:bold"
        );

        console.log(
            "Ideas connect here. Build something new."
        );
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            init,
            { once: true }
        );
    } else {
        init();
    }

    return {
        $,
        $$,
        toast,
        get,
        set,
        remove,
        copy,
        setLoading
    };
})();
