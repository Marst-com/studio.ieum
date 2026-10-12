
(() => {
    "use strict";

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) =>
        [...root.querySelectorAll(selector)];

    const welcomeMessages = [
        "오늘은 어떤 아이디어를 현실로 만들까?",
        "작은 실험이 새로운 가능성을 만든다.",
        "생각만 하지 말고 직접 만들어 보자.",
        "실패도 기록하면 다음 실험의 재료가 돼.",
        "오늘의 호기심이 내일의 기술이 될 수 있어.",
        "상상하고, 실험하고, 연결해 봐!",
        "코드 한 줄에서 새로운 세계가 시작돼."
    ];

    const experiments = [
        {
            icon: "🧠",
            title: "아이디어 생성기",
            description: "키워드 몇 개로 새로운 프로젝트 아이디어 만들기",
            category: "창작",
            link: "pages/lab.html#idea-generator"
        },
        {
            icon: "🔐",
            title: "보안 탐험",
            description: "비밀번호와 웹 보안의 기본 원리 알아보기",
            category: "보안",
            link: "pages/lab.html#security-quiz"
        },
        {
            icon: "🎨",
            title: "브랜드 컬러 실험",
            description: "IEUM에 어울리는 색상 조합 직접 만들어 보기",
            category: "디자인",
            link: "pages/lab.html#color-lab"
        },
        {
            icon: "💻",
            title: "코드 실험실",
            description: "코드를 작성하고 결과를 확인하는 연습하기",
            category: "개발",
            link: "pages/lab.html#code-playground"
        },
        {
            icon: "🚀",
            title: "미래 프로젝트 설계",
            description: "새로운 서비스의 기능과 목표 구상하기",
            category: "기획",
            link: "pages/lab.html#project-planner"
        }
    ];

    function getTodayKey() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function readActivity() {
        try {
            const activity = IEUM.get("activity", []);
            return Array.isArray(activity) ? activity : [];
        } catch {
            return [];
        }
    }

    function saveActivity(activity) {
        try {
            IEUM.set("activity", activity.slice(0, 12));
        } catch (error) {
            console.warn("활동 기록을 저장하지 못했어.", error);
        }
    }

    function recordActivity(title, category = "탐험") {
        const activity = readActivity();

        activity.unshift({
            title,
            category,
            time: new Date().toISOString()
        });

        saveActivity(activity);

        window.dispatchEvent(
            new CustomEvent("ieum:activity-updated", {
                detail: { title, category }
            })
        );

        renderActivity();
    }

    function formatTime(isoString) {
        const date = new Date(isoString);

        if (Number.isNaN(date.getTime())) {
            return "기록된 시간 없음";
        }

        const today = new Date();
        const isToday =
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate();

        if (isToday) {
            return `오늘 ${date.toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit"
            })}`;
        }

        return date.toLocaleDateString("ko-KR", {
            month: "long",
            day: "numeric"
        });
    }

    function renderActivity() {
        const container = $("#recentActivity");

        if (!container) {
            return;
        }

        const activity = readActivity();

        if (activity.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-state-icon">✨</span>
                    <strong>아직 활동 기록이 없어.</strong>
                    <p>Lab에서 첫 번째 실험을 시작해 봐!</p>
                    <a class="button button-ghost" href="pages/lab.html">
                        첫 실험 시작하기
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = activity
            .slice(0, 6)
            .map((item) => {
                const title = escapeHTML(item.title || "이름 없는 활동");
                const category = escapeHTML(item.category || "탐험");
                const time = escapeHTML(formatTime(item.time));

                return `
                    <article class="activity-item">
                        <span class="activity-dot"></span>
                        <div class="activity-content">
                            <strong>${title}</strong>
                            <span>${category} · ${time}</span>
                        </div>
                    </article>
                `;
            })
            .join("");
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, (character) => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[character];
        });
    }

    function renderWelcome() {
        const welcome = $("#welcomeMessage");

        if (!welcome) {
            return;
        }

        const lastIndex = Number(IEUM.get("welcomeIndex", -1));
        let nextIndex = Math.floor(Math.random() * welcomeMessages.length);

        if (welcomeMessages.length > 1 && nextIndex === lastIndex) {
            nextIndex = (nextIndex + 1) % welcomeMessages.length;
        }

        welcome.textContent = welcomeMessages[nextIndex];
        IEUM.set("welcomeIndex", nextIndex);
    }

    function renderDailyExperiment() {
        const container = $("#dailyExperiment");

        if (!container) {
            return;
        }

        const date = getTodayKey();
        let selectedIndex = Number(IEUM.get("dailyExperimentIndex", -1));
        const savedDate = IEUM.get("dailyExperimentDate", "");

        if (
            savedDate !== date ||
            !Number.isInteger(selectedIndex) ||
            selectedIndex < 0 ||
            selectedIndex >= experiments.length
        ) {
            selectedIndex = Math.floor(
                Math.random() * experiments.length
            );

            IEUM.set("dailyExperimentDate", date);
            IEUM.set("dailyExperimentIndex", selectedIndex);
        }

        const experiment = experiments[selectedIndex];

        container.innerHTML = `
            <div class="daily-experiment-icon">${experiment.icon}</div>
            <div class="daily-experiment-content">
                <span class="eyebrow">TODAY'S EXPERIMENT · ${experiment.category}</span>
                <h3>${experiment.title}</h3>
                <p>${experiment.description}</p>
                <a
                    class="button button-primary"
                    href="${experiment.link}"
                    data-experiment-link
                >
                    실험 시작하기 <span aria-hidden="true">→</span>
                </a>
            </div>
        `;

        const link = $("[data-experiment-link]", container);

        link?.addEventListener("click", () => {
            recordActivity(experiment.title, experiment.category);
        });
    }

    function renderStats() {
        const activity = readActivity();
        const today = getTodayKey();

        const todayCount = activity.filter((item) => {
            if (!item.time) {
                return false;
            }

            return item.time.slice(0, 10) === today;
        }).length;

        const totalCount = activity.length;

        const todayElement = $("#todayActivityCount");
        const totalElement = $("#totalActivityCount");

        if (todayElement) {
            todayElement.textContent = String(todayCount);
        }

        if (totalElement) {
            totalElement.textContent = String(totalCount);
        }
    }

    function setupQuickActions() {
        $$("[data-quick-action]").forEach((button) => {
            button.addEventListener("click", () => {
                const action = button.dataset.quickAction;

                const destinations = {
                    lab: "pages/lab.html",
                    idea: "pages/lab.html#idea-generator",
                    code: "pages/lab.html#code-playground",
                    history: "pages/history.html",
                    about: "pages/about.html"
                };

                const destination = destinations[action];

                if (!destination) {
                    IEUM.toast("아직 준비되지 않은 기능이야.");
                    return;
                }

                const labels = {
                    lab: "Lab 열기",
                    idea: "아이디어 생성기 열기",
                    code: "코드 실험실 열기",
                    history: "IEUM 역사 보기",
                    about: "IEUM 소개 보기"
                };

                recordActivity(labels[action], "빠른 실행");
                window.location.href = destination;
            });
        });
    }

    function setupExperimentRefresh() {
        const button = $("#refreshExperiment");

        if (!button) {
            return;
        }

        button.addEventListener("click", () => {
            const current = Number(
                IEUM.get("dailyExperimentIndex", -1)
            );

            let next = Math.floor(Math.random() * experiments.length);

            if (experiments.length > 1 && next === current) {
                next = (next + 1) % experiments.length;
            }

            IEUM.set("dailyExperimentIndex", next);
            IEUM.set("dailyExperimentDate", getTodayKey());

            renderDailyExperiment();
            IEUM.toast("새로운 실험을 추천했어!");
        });
    }

    function setupActivityClear() {
        const button = $("#clearActivity");

        if (!button) {
            return;
        }

        button.addEventListener("click", () => {
            if (readActivity().length === 0) {
                IEUM.toast("삭제할 활동 기록이 없어.");
                return;
            }

            const confirmed = window.confirm(
                "저장된 활동 기록을 모두 삭제할까?"
            );

            if (!confirmed) {
                return;
            }

            IEUM.remove("activity");
            renderActivity();
            renderStats();

            IEUM.toast("활동 기록을 삭제했어.");
        });
    }

    function init() {
        renderWelcome();
        renderDailyExperiment();
        renderActivity();
        renderStats();

        setupQuickActions();
        setupExperimentRefresh();
        setupActivityClear();

        window.addEventListener("ieum:activity-updated", () => {
            renderActivity();
            renderStats();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, {
            once: true
        });
    } else {
        init();
    }
})();
