
(() => {
    "use strict";

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) =>
        [...root.querySelectorAll(selector)];

    function initHistory() {
        const timeline = $("#historyTimeline");
        const searchInput = $("#historySearch");
        const sortSelect = $("#historySort");
        const filters = $("#historyFilters");
        const resultCount = $("#historyResultCount");
        const totalCount = $("#historyTotal");
        const emptyState = $("#historyEmpty");
        const resetButton = $("#resetHistoryFilters");
        const emptyResetButton = $("#emptyResetButton");

        if (!timeline) {
            return;
        }

        const originalItems = $$(".timeline-item", timeline);
        let selectedCategory = "all";
        let searchQuery = "";

        if (totalCount) {
            totalCount.textContent = String(originalItems.length);
        }

        function normalize(value) {
            return String(value ?? "")
                .normalize("NFKC")
                .toLocaleLowerCase("ko-KR")
                .trim();
        }

        function getSearchText(item) {
            return normalize([
                item.dataset.category,
                item.dataset.date,
                item.dataset.keywords,
                item.textContent
            ].join(" "));
        }

        function getDate(item) {
            const date = Date.parse(item.dataset.date || "");
            return Number.isNaN(date) ? 0 : date;
        }

        function getTitle(item) {
            return normalize($("h3", item)?.textContent || "");
        }

        function applyFilters() {
            const query = normalize(searchQuery);

            const visibleItems = originalItems.filter((item) => {
                const matchesCategory =
                    selectedCategory === "all" ||
                    item.dataset.category === selectedCategory;

                const matchesSearch =
                    query.length === 0 ||
                    getSearchText(item).includes(query);

                return matchesCategory && matchesSearch;
            });

            const sortMode = sortSelect?.value || "newest";

            visibleItems.sort((a, b) => {
                if (sortMode === "oldest") {
                    return getDate(a) - getDate(b);
                }

                if (sortMode === "title") {
                    return getTitle(a).localeCompare(
                        getTitle(b),
                        "ko-KR"
                    );
                }

                return getDate(b) - getDate(a);
            });

            const visibleSet = new Set(visibleItems);

            originalItems.forEach((item) => {
                item.hidden = !visibleSet.has(item);
            });

            visibleItems.forEach((item) => {
                timeline.appendChild(item);
            });

            if (resultCount) {
                resultCount.textContent =
                    `${visibleItems.length}개의 기록`;
            }

            if (emptyState) {
                emptyState.hidden = visibleItems.length !== 0;
            }

            timeline.hidden = visibleItems.length === 0;

            updateFilterButtons();
        }

        function updateFilterButtons() {
            if (!filters) {
                return;
            }

            $$("[data-category]", filters).forEach((button) => {
                const isActive =
                    button.dataset.category === selectedCategory;

                button.classList.toggle("active", isActive);
                button.setAttribute(
                    "aria-pressed",
                    String(isActive)
                );
            });
        }

        function resetFilters() {
            selectedCategory = "all";
            searchQuery = "";

            if (searchInput) {
                searchInput.value = "";
            }

            if (sortSelect) {
                sortSelect.value = "newest";
            }

            applyFilters();
            searchInput?.focus();
        }

        searchInput?.addEventListener("input", () => {
            searchQuery = searchInput.value;
            applyFilters();
        });

        sortSelect?.addEventListener("change", applyFilters);

        filters?.addEventListener("click", (event) => {
            const button = event.target.closest("[data-category]");

            if (!button || !filters.contains(button)) {
                return;
            }

            selectedCategory = button.dataset.category || "all";
            applyFilters();
        });

        timeline.addEventListener("click", (event) => {
            const button = event.target.closest(".timeline-toggle");

            if (!button || !timeline.contains(button)) {
                return;
            }

            const item = button.closest(".timeline-content");
            const detail = item?.querySelector(".timeline-detail");

            if (!detail) {
                return;
            }

            const isExpanded =
                button.getAttribute("aria-expanded") === "true";

            button.setAttribute(
                "aria-expanded",
                String(!isExpanded)
            );

            detail.hidden = isExpanded;

            const label = isExpanded
                ? "상세 내용 보기"
                : "상세 내용 접기";

            button.innerHTML = `
                ${label}
                <span aria-hidden="true">${isExpanded ? "＋" : "−"}</span>
            `;
        });

        resetButton?.addEventListener("click", resetFilters);
        emptyResetButton?.addEventListener("click", resetFilters);

        document.addEventListener("keydown", (event) => {
            const target = event.target;
            const isTyping =
                target instanceof HTMLElement &&
                (
                    target.isContentEditable ||
                    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
                );

            if (
                event.key === "/" &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.altKey &&
                !isTyping
            ) {
                event.preventDefault();
                searchInput?.focus();
            }

            if (event.key === "Escape" && target === searchInput) {
                searchInput.value = "";
                searchQuery = "";
                applyFilters();
                searchInput.blur();
            }
        });

        applyFilters();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initHistory, {
            once: true
        });
    } else {
        initHistory();
    }
})();
