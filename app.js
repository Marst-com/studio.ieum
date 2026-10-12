
"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const STORAGE_KEY = "ieum-studio-progress-v1";
const DESIGN_KEY = "ieum-studio-design-v1";

const defaultProgress = {
    read: false,
    ai: false,
    code: false,
    security: false,
    design: false,
    idea: false,
    projects: false,
    faq: false
};

let progress = loadProgress();
let currentLanguage = "ko";
let toastTimer = null;
let securityIndex = 0;

function loadProgress() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return { ...defaultProgress, ...(saved || {}) };
    } catch {
        return { ...defaultProgress };
    }
}

function saveProgress() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
        showToast("브라우저 저장 공간에 접근할 수 없어.");
    }
}

function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}

function completeMission(key, message = "미션 완료! 탐험 기록에 저장했어.") {
    if (!(key in defaultProgress)) return;

    if (progress[key]) {
        showToast("이미 완료한 미션이야.");
        return;
    }

    progress[key] = true;
    saveProgress();
    renderProgress();
    showToast(message);
}

function renderProgress() {
    const keys = Object.keys(defaultProgress);
    const completed = keys.filter(key => progress[key]).length;
    const percent = Math.round((completed / keys.length) * 100);

    $("#progressText").textContent = `${completed} / ${keys.length}`;
    $("#progressPercent").textContent = `${percent}%`;
    $("#progressFill").style.width = `${percent}%`;
    $("#visitorCount").textContent = String(completed).padStart(3, "0");

    const messages = [
        "첫 번째 체험을 시작해 봐!",
        "좋아! 호기심이 탐험으로 바뀌고 있어.",
        "계속 실험해 봐. 새로운 걸 발견할 수 있어.",
        "절반 이상 왔어! 다른 체험도 둘러봐.",
        "거의 다 왔어. 마지막 미션에 도전해 봐!",
        "모든 미션 완료! IEUM 탐험 마스터야!"
    ];

    const messageIndex = Math.min(
        messages.length - 1,
        Math.floor(completed / keys.length * (messages.length - 1))
    );

    $("#progressMessage").textContent = messages[messageIndex];

    $$(".mission-row input").forEach(input => {
        input.checked = Boolean(progress[input.dataset.mission]);
    });

    const badgeKeys = [
        "ai", "code", "security", "design",
        "idea", "projects", "read", "faq"
    ];

    $$(".badge-item").forEach((badge, index) => {
        const unlocked = Boolean(progress[badgeKeys[index]]);
        badge.classList.toggle("locked", !unlocked);
        badge.setAttribute("aria-label", unlocked ? "배지 획득" : "잠긴 배지");
    });
}

function activateLab(name) {
    $$(".lab-tab").forEach(button => {
        const active = button.dataset.lab === name;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
    });

    $$(".lab-panel").forEach(panel => {
        const active = panel.id === `lab-${name}`;
        panel.hidden = !active;
        panel.classList.toggle("active", active);
    });
}

$$(".lab-tab").forEach(button => {
    button.addEventListener("click", () => activateLab(button.dataset.lab));
});

$("#exploreBtn").addEventListener("click", () => {
    $("#labs").scrollIntoView({ behavior: "smooth" });
});

$("#menuBtn").addEventListener("click", () => {
    const nav = $("#mainNav");
    const opened = nav.classList.toggle("open");
    $("#menuBtn").setAttribute("aria-expanded", String(opened));
    $("#menuBtn").setAttribute("aria-label", opened ? "메뉴 닫기" : "메뉴 열기");
});

$$(".main-nav a").forEach(link => {
    link.addEventListener("click", () => {
        $("#mainNav").classList.remove("open");
        $("#menuBtn").setAttribute("aria-expanded", "false");
    });
});

$("#backToTop").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});

$("#year").textContent = new Date().getFullYear();

/* AI demo: rule-based simulation, not a real model. */
const aiExamples = {
    simple: {
        title: "쉽게 설명하기",
        template: prompt =>
            `"${prompt}"라는 질문을 받았어.\n\n쉽게 접근하려면 먼저 핵심 개념을 한 문장으로 정리하고, 익숙한 예시와 연결하면 좋아.\n\n1. 핵심이 무엇인지 찾아봐.\n2. 어려운 용어를 쉬운 말로 바꿔 봐.\n3. 예시를 들어 설명해 봐.\n\n이 데모는 실제 AI가 질문의 의미를 이해해 생성한 답변이 아니라, 설명 구조를 보여 주는 예시야.`
    },
    logical: {
        title: "논리적으로 분석하기",
        template: prompt =>
            `분석 대상: "${prompt}"\n\n[1] 질문 정의\n무엇을 알고 싶은지 구체적으로 구분해.\n\n[2] 필요한 정보\n답을 판단하는 데 필요한 사실과 조건을 정리해.\n\n[3] 검증 방법\n주장에 근거가 있는지 확인하고, 반례가 가능한지 살펴봐.\n\n[4] 결론\n현재 입력만으로는 구체적인 사실 판단을 할 수 없어. 조건과 자료를 추가하면 더 정확하게 분석할 수 있어.\n\n※ 이 결과는 고정된 분석 템플릿이야.`
    },
    creative: {
        title: "창의적으로 생각하기",
        template: prompt =>
            `아이디어 출발점: "${prompt}"\n\n✦ 관점 바꾸기 — 정반대 입장에서 바라보면 어떨까?\n✦ 연결하기 — 전혀 다른 분야와 결합하면 어떨까?\n✦ 제한 두기 — 시간이나 자원이 절반이라면 어떻게 만들까?\n✦ 뒤집기 — 가장 불편한 부분을 핵심 기능으로 바꿀 수 있을까?\n\n도전: 이 네 가지 중 하나를 골라 새로운 아이디어를 직접 적어 봐.\n\n※ 이 데모는 창의적 사고를 돕는 고정 질문 목록이야.`
    },
    steps: {
        title: "단계별 안내",
        template: prompt =>
            `작업 주제: "${prompt}"\n\nSTEP 1. 목표를 한 문장으로 작성하기\nSTEP 2. 현재 알고 있는 사실과 모르는 부분 나누기\nSTEP 3. 작은 작업 세 개로 분리하기\nSTEP 4. 첫 번째 작업을 직접 실행하기\nSTEP 5. 결과를 확인하고 수정하기\n\n시작할 일: "${prompt}"를 실제로 해결하려면 무엇이 필요한지 한 문장으로 써 봐.\n\n※ 실제 상황에 맞춘 계획이 아니라 일반적인 작업 절차 예시야.`
    }
};

$("#runAI").addEventListener("click", () => {
    const prompt = $("#aiPrompt").value.trim();
    const mode = $("#aiMode").value;

    if (!prompt) {
        showToast("먼저 질문을 입력해 줘.");
        $("#aiPrompt").focus();
        return;
    }

    const result = aiExamples[mode];
    const output = $("#aiOutput");

    output.replaceChildren();

    const heading = document.createElement("h4");
    heading.textContent = `✳ ${result.title}`;

    const answer = document.createElement("p");
    answer.textContent = result.template(prompt);

    output.append(heading, answer);
    completeMission("ai");
});

/* Code playground: iframe sandbox isolates the preview. */
const initialCode = $("#codeInput").value;

function runCodePreview() {
    const code = $("#codeInput").value;
    const preview = $("#codePreview");

    preview.srcdoc = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body { margin: 0; padding: 14px; font-family: system-ui, sans-serif; }
img, video, iframe { max-width: 100%; }
button, input { max-width: 100%; }
</style>
</head>
<body>${code}</body>
</html>`;

    showToast("코드를 미리보기 영역에서 실행했어.");
    completeMission("code");
}

$("#runCode").addEventListener("click", runCodePreview);

$("#resetCode").addEventListener("click", () => {
    $("#codeInput").value = initialCode;
    runCodePreview();
    showToast("예제 코드를 복원했어.");
});

/* Security quiz */
const securityCases = [
    {
        message: "[긴급] 계정이 10분 후 정지됩니다! 아래 링크에서 즉시 비밀번호를 입력하세요. 보상 포인트도 지급됩니다.",
        options: [
            "메시지에 느낌표가 있다.",
            "긴급함을 강조하고 비밀번호 입력을 요구한다.",
            "발신자 이름이 짧다.",
            "문장이 한국어로 쓰여 있다."
        ],
        answer: 1,
        explanation: "정답! 시간 압박과 비밀번호 입력 요구는 위험 신호야. 링크를 누르지 말고 공식 앱이나 주소를 직접 열어 확인해."
    },
    {
        message: "택배 주소가 잘못되었습니다. 배송을 계속하려면 지금 카드 정보와 인증번호를 입력하세요.",
        options: [
            "택배라는 단어가 있다.",
            "배송 안내가 짧다.",
            "카드 정보와 인증번호를 요구한다.",
            "문장에 마침표가 있다."
        ],
        answer: 2,
        explanation: "정답! 배송 확인을 이유로 카드 정보나 인증번호를 요구하면 매우 의심해야 해. 공식 배송사 앱에서 직접 확인해."
    },
    {
        message: "친구가 보낸 메시지: 이 파일 열어 봐! 로그인 화면이 나오면 계정 비밀번호도 입력해 줘.",
        options: [
            "파일과 비밀번호 입력을 함께 요구한다.",
            "친구라는 표현을 사용했다.",
            "느낌표가 있다.",
            "문장이 짧다."
        ],
        answer: 0,
        explanation: "정답! 아는 사람의 계정이 탈취됐을 수도 있어. 다른 연락 수단으로 친구에게 직접 확인하고 의심스러운 파일은 열지 마."
    },
    {
        message: "축하합니다! 당첨 선물을 받으려면 계정 비밀번호와 문자 인증번호를 알려 주세요.",
        options: [
            "선물을 언급한다.",
            "축하한다고 말한다.",
            "문자 인증번호와 비밀번호를 요구한다.",
            "문장 끝에 마침표가 없다."
        ],
        answer: 2,
        explanation: "정답! 비밀번호나 일회용 인증번호는 다른 사람에게 알려 주면 안 돼. 당첨을 빌미로 개인정보를 요구하면 공식 경로에서 검증해."
    }
];

function renderSecurityCase() {
    const item = securityCases[securityIndex];
    $("#phishingMessage").textContent = item.message;
    $("#securityFeedback").textContent = "";
    $("#securityOptions").replaceChildren();

    const header = $(".case-header span");
    header.textContent = `CASE FILE #${String(securityIndex + 1).padStart(3, "0")}`;

    item.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = option;

        button.addEventListener("click", () => {
            const allButtons = $$("#securityOptions button");
            allButtons.forEach((candidate, candidateIndex) => {
                candidate.disabled = true;
                if (candidateIndex === item.answer) {
                    candidate.classList.add("correct-answer");
                } else if (candidate === button) {
                    candidate.classList.add("wrong-answer");
                }
            });

            $("#securityFeedback").textContent =
                index === item.answer
                    ? item.explanation
                    : `아쉽지만 정답은 "${item.options[item.answer]}"야. ${item.explanation}`;

            if (index === item.answer) {
                completeMission("security");
            }
        });

        $("#securityOptions").append(button);
    });
}

$("#nextSecurity").addEventListener("click", () => {
    securityIndex = (securityIndex + 1) % securityCases.length;
    renderSecurityCase();
});

/* Design playground */
function updateBrandPreview() {
    const name = $("#brandName").value.trim() || "IEUM";
    const slogan = $("#brandSlogan").value.trim() || "Ideas Become Reality";
    const color = $("#brandColor").value;

    $("#previewName").textContent = name;
    $("#previewSlogan").textContent = slogan;
    $("#colorValue").textContent = color.toUpperCase();
    $("#brandPreview").style.setProperty("--brand-color", color);
}

["brandName", "brandSlogan", "brandColor"].forEach(id => {
    $(`#${id}`).addEventListener("input", updateBrandPreview);
});

$("#randomColor").addEventListener("click", () => {
    const colors = [
        "#8b7cff", "#58c8ff", "#e69aff", "#5de0b1",
        "#ff9fbc", "#ffcb78", "#7d9cff", "#b2e86f"
    ];

    $("#brandColor").value = colors[Math.floor(Math.random() * colors.length)];
    updateBrandPreview();
});

$("#saveDesign").addEventListener("click", () => {
    const design = {
        name: $("#brandName").value.slice(0, 28),
        slogan: $("#brandSlogan").value.slice(0, 80),
        color: $("#brandColor").value
    };

    try {
        localStorage.setItem(DESIGN_KEY, JSON.stringify(design));
        completeMission("design", "디자인을 이 기기에 저장했어!");
    } catch {
        showToast("디자인을 저장하지 못했어.");
    }
});

function loadDesign() {
    try {
        const design = JSON.parse(localStorage.getItem(DESIGN_KEY));
        if (!design) return;

        $("#brandName").value = typeof design.name === "string" ? design.name : "IEUM";
        $("#brandSlogan").value = typeof design.slogan === "string"
            ? design.slogan
            : "Ideas Become Reality";

        if (typeof design.color === "string" && /^#[0-9a-f]{6}$/i.test(design.color)) {
            $("#brandColor").value = design.color;
        }
    } catch {
        // Ignore invalid local data.
    }

    updateBrandPreview();
}

/* Idea generator */
const technologies = [
    "AI", "날씨 데이터", "브라우저 기술", "코드 분석",
    "음성 인식", "이미지 처리", "보안 검사", "자동화",
    "게임 로직", "개인화 추천"
];

const problems = [
    "복잡한 정보를 쉽게 이해하기",
    "반복 작업 줄이기",
    "개인정보를 안전하게 지키기",
    "공부를 더 재미있게 만들기",
    "아이디어를 빠르게 시험하기",
    "느린 기기에서도 잘 작동하기",
    "디자인 선택을 쉽게 하기",
    "데이터에서 패턴 찾기",
    "친구와 함께 창작하기",
    "초보자의 실수를 줄이기"
];

const formats = [
    "인터랙티브 웹 도구",
    "작은 AI 실험실",
    "모바일 앱 프로토타입",
    "오픈소스 개발자 도구",
    "교육용 미니게임",
    "개인용 대시보드",
    "브라우저 확장 프로그램",
    "데이터 시각화 도구"
];

function pickRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function generateIdea() {
    const technology = pickRandom(technologies);
    const problem = pickRandom(problems);
    const format = pickRandom(formats);

    $("#ideaResult").replaceChildren();

    const label = document.createElement("span");
    label.className = "idea-result-label";
    label.textContent = "YOUR NEXT EXPERIMENT";

    const symbol = document.createElement("div");
    symbol.className = "idea-result-symbol";
    symbol.textContent = "✳";

    const heading = document.createElement("h3");
    heading.textContent = `${technology} × ${format}`;

    const description = document.createElement("p");
    description.textContent = `${problem}를 해결하는 작은 프로젝트를 만들어 봐. 첫 버전은 기능 하나만 구현하고, 실제로 써 본 뒤 개선하는 게 목표야.`;

    const chips = document.createElement("div");
    chips.className = "idea-chips";

    [technology, problem, format].forEach(text => {
        const chip = document.createElement("span");
        chip.textContent = text;
        chips.append(chip);
    });

    $("#ideaResult").append(label, symbol, heading, description, chips);
    completeMission("idea");
}

$("#generateIdea").addEventListener("click", generateIdea);

$("#suggestProject").addEventListener("click", () => {
    const subject = encodeURIComponent("IEUM Studio 프로젝트 아이디어");
    const body = encodeURIComponent(
        "프로젝트 이름:\n\n해결하고 싶은 문제:\n\n핵심 기능:\n\n왜 필요한가?\n"
    );

    // Replace this placeholder with a real contact address when available.
    const contactAddress = "";
    if (!contactAddress) {
        showToast("아직 공식 제안 메일 주소가 설정되지 않았어. FAQ와 README에서 연락 방법을 추가할 수 있어.");
        $("#faq").scrollIntoView({ behavior: "smooth" });
        return;
    }

    window.location.href = `mailto:${contactAddress}?subject=${subject}&body=${body}`;
});

/* Mission checklist */
$$(".mission-row input").forEach(input => {
    input.addEventListener("change", () => {
        const key = input.dataset.mission;
        progress[key] = input.checked;
        saveProgress();
        renderProgress();

        showToast(input.checked ? "탐험 기록을 저장했어!" : "미션 체크를 취소했어.");
    });
});

$$("[data-complete]").forEach(button => {
    button.addEventListener("click", () => {
        completeMission(button.dataset.complete);
    });
});

$("#resetProgress").addEventListener("click", () => {
    const confirmed = window.confirm("이 기기에 저장된 탐험 기록을 모두 지울까?");
    if (!confirmed) return;

    progress = { ...defaultProgress };
    saveProgress();
    renderProgress();
    showToast("탐험 기록을 초기화했어.");
});

/* Mark sections as explored when the visitor actually opens them. */
const sectionObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        if (entry.target.id === "about") {
            completeMission("read");
        }

        if (entry.target.id === "projects") {
            completeMission("projects");
        }

        if (entry.target.id === "faq") {
            completeMission("faq");
        }
    }
}, { threshold: 0.25 });

["about", "projects", "faq"].forEach(id => {
    const section = document.getElementById(id);
    if (section) sectionObserver.observe(section);
});

/* Korean / English UI text */
const translations = {
    en: {
        navAbout: "About",
        navLabs: "Labs",
        navProjects: "Projects",
        navMissions: "Missions",
        navExplore: "Start exploring ↗",
        heroTitle: "Connect ideas,<br><span class=\"gradient-text\">build something.</span>",
        heroDesc: "IEUM Studio is a small creative tech studio exploring AI, software and design. Don't just look around — experiment and create.",
        heroPrimary: "Enter the labs ↗",
        heroSecondary: "Discover IEUM ↓",
        heroNote: "No installation · Free demos · Runs in your browser",
        statVisitors: "Your exploration record",
        statIdeas: "Possibilities",
        statRule: "Rule: Try it yourself",
        aboutTitle: "Start small.<br><span class=\"gradient-text\">Think bigger.</span>",
        aboutDesc: "Rather than pretending to be a giant company, we focus on turning ideas into working experiments.",
        philosophyTitle: "Connections make new things possible.",
        philosophyDesc: "IEUM connects ideas with technology, and makers with learners. We build a working first version, experiment and improve instead of waiting for a perfect plan.",
        principleOne: "Build directly",
        principleOneDesc: "An idea becomes a project when you try it.",
        principleTwo: "Make it approachable",
        principleTwoDesc: "Make complex technology easier to explore.",
        principleThree: "Build securely",
        principleThreeDesc: "Security and privacy matter from day one.",
        processOne: "Idea",
        processTwo: "Experiment",
        processThree: "Build",
        processFour: "Improve",
        labsTitle: "Stop watching.<br><span class=\"gradient-text\">Start experimenting.</span>",
        labsDesc: "These demos run in your browser. Explore without an AI server or external account.",
        aiLabTitle: "AI Thinking Lab",
        aiLabDesc: "The same question can produce different styles of responses. Try changing the way a response is structured.",
        promptLabel: "What should we ask?",
        answerStyle: "Response style",
        runExperiment: "Run experiment ↗",
        simulationNotice: "This is a rule-based demo, not a real AI model.",
        aiChallengeTitle: "Challenge",
        aiChallengeDesc: "Keep the question and change only the response style.",
        markDone: "Mark complete +1",
        codeLabTitle: "Browser Code Playground",
        codeLabDesc: "Edit HTML and preview the result in an isolated browser frame.",
        securityLabTitle: "Security Detective",
        securityLabDesc: "Find suspicious clues in these educational examples.",
        securityQuestion: "What is the most suspicious clue?",
        designLabTitle: "Brand Design Lab",
        designLabDesc: "Change the color, name and slogan to create your own brand concept.",
        projectsTitle: "Where ideas<br><span class=\"gradient-text\">come to life.</span>",
        projectsDesc: "Explore the kinds of projects IEUM wants to build. Concepts are labeled honestly.",
        marstDesc: "An experimental project exploring a Korean-focused language model and its training structure.",
        editorDesc: "A creative tool concept combining video editing and AI assistance.",
        weatherDesc: "A concept for analyzing weather observations with data and machine learning.",
        codingDesc: "A reusable coding dictionary for symbols, tags, keywords and syntax.",
        analyticsDesc: "A privacy-conscious analytics tool concept that keeps sensitive server details private.",
        nextProjectTitle: "What's next?",
        nextProjectDesc: "The next idea is still open. Suggest one yourself.",
        ideaTitle: "Stuck?<br><span class=\"gradient-text\">Mix some ideas.</span>",
        ideaDesc: "Combine technologies and problems to find a new project starting point.",
        missionsTitle: "Don't just visit.<br><span class=\"gradient-text\">Become an explorer.</span>",
        missionsDesc: "Your progress is saved locally on this device, not sent to an account or server.",
        progressTitle: "My exploration progress",
        missionListTitle: "Exploration checklist",
        faqTitle: "Good questions.",
        faqDesc: "Learn about IEUM and how this website works.",
        ctaTitle: "Don't just imagine.<br><span class=\"gradient-text\">Try building it.</span>",
        ctaDesc: "One small experiment could be the beginning of your next project."
    }
};

function setLanguage(language) {
    currentLanguage = language;
    document.documentElement.lang = language;
    $("#languageBtn").textContent = language === "ko" ? "EN" : "KO";

    $$("[data-i18n]").forEach(element => {
        const key = element.dataset.i18n;
        if (language === "ko") {
            if (element.dataset.originalText !== undefined) {
                element.innerHTML = element.dataset.originalText;
            }
        } else if (translations.en[key]) {
            if (element.dataset.originalText === undefined) {
                element.dataset.originalText = element.innerHTML;
            }
            element.innerHTML = translations.en[key];
        }
    });

    showToast(language === "en" ? "English UI enabled." : "한국어 화면으로 전환했어.");
}

$("#languageBtn").addEventListener("click", () => {
    setLanguage(currentLanguage === "ko" ? "en" : "ko");
});

/* Keyboard access to lab tabs. */
$$(".lab-tab").forEach((tab, index, tabs) => {
    tab.addEventListener("keydown", event => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const next = (index + direction + tabs.length) % tabs.length;
        tabs[next].focus();
        tabs[next].click();
    });
});

/* Initialize */
renderSecurityCase();
runCodePreview();
loadDesign();
renderProgress();
