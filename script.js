const kanaMap = {
    a: { hiragana: ["あ", "い", "う", "え", "お"], katakana: ["ア", "イ", "ウ", "エ", "オ"], roma: ["a", "i", "u", "e", "o"] },
    k: { hiragana: ["か", "き", "く", "け", "こ"], katakana: ["カ", "キ", "ク", "ケ", "コ"], roma: ["ka", "ki", "ku", "ke", "ko"] },
    s: { hiragana: ["さ", "し", "す", "せ", "そ"], katakana: ["サ", "シ", "ス", "セ", "ソ"], roma: ["sa", "shi", "su", "se", "so"] },
    t: { hiragana: ["た", "ち", "つ", "て", "と"], katakana: ["タ", "チ", "ツ", "テ", "ト"], roma: ["ta", "chi", "tsu", "te", "to"] },
    n: { hiragana: ["な", "に", "ぬ", "ね", "の"], katakana: ["ナ", "ニ", "ヌ", "ネ", "ノ"], roma: ["na", "ni", "nu", "ne", "no"] },
    h: { hiragana: ["は", "ひ", "ふ", "へ", "ほ"], katakana: ["ハ", "ヒ", "フ", "ヘ", "ホ"], roma: ["ha", "hi", "fu", "he", "ho"] },
    m: { hiragana: ["ま", "み", "む", "め", "も"], katakana: ["マ", "ミ", "ム", "メ", "モ"], roma: ["ma", "mi", "mu", "me", "mo"] },
    y: { hiragana: ["や", "ゆ", "よ"], katakana: ["ヤ", "ユ", "ヨ"], roma: ["ya", "yu", "yo"] },
    r: { hiragana: ["ら", "り", "る", "れ", "ろ"], katakana: ["ラ", "リ", "ル", "レ", "ロ"], roma: ["ra", "ri", "ru", "re", "ro"] },
    w: { hiragana: ["わ", "を", "ん"], katakana: ["ワ", "ヲ", "ン"], roma: ["wa", "wo", "n"] }
};

let correct = 0, wrong = 0, total = 0;
let currentAnswer = "";
let timer;
let scrambleInterval;

// === CÁC BIẾN MỚI CHO ÂM THANH (WEB SPEECH API) ===
let audioEnabled = true; // Mặc định bật âm thanh
const synth = window.speechSynthesis;
// Tìm giọng Nhật Bản (ja-JP) để phát âm chính xác
let voice = null;
if (synth) {
    synth.onvoiceschanged = () => {
        voice = synth.getVoices().find(v => v.lang === 'ja-JP') || null;
    };
    if (synth.getVoices().length > 0) {
        voice = synth.getVoices().find(v => v.lang === 'ja-JP') || null;
    }
}

// === HÀM PHÁT ÂM MỚI ===
function speakKana(kana) {
    if (!audioEnabled || !synth) return;

    // Hủy bỏ giọng nói đang chạy (nếu có)
    if (synth.speaking) {
        synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(kana);
    utterance.lang = 'ja-JP';
    
    let qMode = document.getElementById("questionMode").value;

    if(qMode === 'toKana'){
        utterance.lang = 'en-US';
        voice = synth.getVoices().find(v => v.lang === 'en-US') || null;
    }else{
        utterance.lang = 'ja-JP';
        voice = synth.getVoices().find(v => v.lang === 'ja-JP') || null;
    }

    if (voice) {
        utterance.voice = voice;
    }
    utterance.rate = 0.8;

    synth.speak(utterance);
}

// === XỬ LÝ NÚT BẬT/TẮT ÂM THANH ===
document.getElementById("toggleAudioBtn").addEventListener('click', function () {
    audioEnabled = !audioEnabled;
    if (audioEnabled) {
        this.textContent = '🔊';
    } else {
        this.textContent = '🔇';
        if (synth && synth.speaking) {
            synth.cancel(); // Tắt âm thanh đang phát
        }
    }
});

const groupKeys = Object.keys(kanaMap);

function renderGroupSwitches() {
    const container = document.getElementById("groupSwitches");
    container.innerHTML = "";

    const rows = [
        { id: 'row-1', keys: groupKeys.slice(0, 5) },  // 5 items
        { id: 'row-2', keys: groupKeys.slice(5, 10) } // 5 items
    ];

    // Xử lý bố cục Desktop: Chuyển tất cả về row-1 duy nhất (Flex-wrap)
    if (window.innerWidth >= 768) {
        const rowDiv = document.createElement("div");
        rowDiv.className = "group-row";
        rowDiv.id = 'row-1';

        groupKeys.forEach(key => {
            const div = document.createElement("div");
            div.className = "switch-container";
            const isChecked = document.querySelector(`.groupFilter[value="${key}"]`) ? document.querySelector(`.groupFilter[value="${key}"]`).checked : true;
            div.innerHTML = `<label class="switch"><input type="checkbox" class="groupFilter" value="${key}" ${isChecked ? 'checked' : ''}><span class="slider"></span></label><span class="switch-label">${key}</span>`;
            rowDiv.appendChild(div);
        });
        container.appendChild(rowDiv);
        // Đảm bảo chỉ có row-1 hiển thị trên desktop
        document.getElementById('row-2')?.remove();
    }
    // Xử lý bố cục Mobile: 5x2 (Grid)
    else {
        rows.forEach(rowInfo => {
            const rowDiv = document.createElement("div");
            rowDiv.className = "group-row";
            rowDiv.id = rowInfo.id;

            rowInfo.keys.forEach(key => {
                const div = document.createElement("div");
                div.className = "switch-container";
                const isChecked = document.querySelector(`.groupFilter[value="${key}"]`) ? document.querySelector(`.groupFilter[value="${key}"]`).checked : true;
                div.innerHTML = `<label class="switch"><input type="checkbox" class="groupFilter" value="${key}" ${isChecked ? 'checked' : ''}><span class="slider"></span></label><span class="switch-label">${key}</span>`;
                rowDiv.appendChild(div);
            });
            container.appendChild(rowDiv);
        });
        // Xóa row-3 cũ nếu nó tồn tại
        document.getElementById('row-3')?.remove();
    }
}

function getSelectedGroups() {
    return [...document.querySelectorAll('.groupFilter:checked')].map(cb => cb.value);
}

function scrambleText(element, finalText, duration = 1500, qMode = "toRoma", mode = "hiragana", groups = [], onComplete) {
    clearInterval(scrambleInterval);
    let chars = "";

    groups.forEach(g => {
        if (qMode === "toRoma") {
            chars += kanaMap[g][mode].join("");
        } else {
            chars += kanaMap[g].roma.join("");
        }
    });

    if (qMode !== "toRoma") {
        chars = [...new Set(chars)].join('');
    }

    let elapsed = 0;
    const interval = 80;
    scrambleInterval = setInterval(() => {
        let display = "";
        let displayLength = 1;

        for (let i = 0; i < displayLength; i++) {
            display += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        element.textContent = display;

        elapsed += interval;
        if (elapsed >= duration) {
            clearInterval(scrambleInterval);
            element.textContent = finalText;
            speakKana(finalText);
            if (onComplete) onComplete();
        }
    }, interval);
}

function startGame() {
    clearTimeout(timer);

    document.querySelectorAll(".answers button").forEach(btn => {
        btn.disabled = false;
        btn.classList.remove("correct", "wrong");
        btn.textContent = "";
    });

    let mode = document.getElementById("mode").value;
    let qMode = document.getElementById("questionMode").value;
    let groups = getSelectedGroups();
    if (groups.length === 0) { alert("Chọn ít nhất 1 nhóm"); return; }

    let group = groups[Math.floor(Math.random() * groups.length)];
    let idx = Math.floor(Math.random() * kanaMap[group].roma.length);
    let kanaChar = kanaMap[group][mode][idx];
    let romaChar = kanaMap[group].roma[idx];

    currentAnswer = (qMode === "toRoma" ? romaChar : kanaChar);
    let questionDisplay = (qMode === "toRoma" ? kanaChar : romaChar);

    const kanaElem = document.getElementById("kana");

    let answers = [currentAnswer];
    const allPossibleAnswers = groups.flatMap(g =>
        (qMode === "toRoma" ? kanaMap[g].roma : kanaMap[g][mode])
    ).filter(ans => ans !== currentAnswer);

    allPossibleAnswers.sort(() => Math.random() - 0.5);
    const incorrectAnswers = allPossibleAnswers.slice(0, 3);
    answers = [...answers, ...incorrectAnswers];

    answers.sort(() => Math.random() - 0.5);

    let buttonAnsShowed = document.getElementsByClassName("switch-show-hide");

    let isButtonChecked = buttonAnsShowed.checked;

    const onAnimationComplete = () => {
        answers.forEach((ans, i) => { document.getElementById("btn" + i).textContent = ans; });
        document.getElementById("status").textContent = !isButtonChecked ? "Đang đợi câu trả lời" : "Chọn đáp án đúng!";

        timer = setTimeout(() => {
            wrong++;
            document.getElementById("wrong").textContent = wrong;

            document.querySelectorAll(".answers button").forEach(btn => {
                if (btn.textContent === currentAnswer) {
                    btn.classList.add("correct");
                }
            });

            document.getElementById("status").textContent = "⏰ Hết giờ! Đáp án đúng: " + currentAnswer;
            document.querySelectorAll(".answers button").forEach(btn => btn.disabled = true);
        }, document.getElementById("thinkTime").value * 1000);
    };

    scrambleText(kanaElem, questionDisplay, 1500, qMode, mode, groups, onAnimationComplete);

    total++;
    document.getElementById("total").textContent = total;
    document.getElementById("status").textContent = "Đang tải câu hỏi...";
}

function chooseAnswer(i) {
    clearTimeout(timer);
    let btn = document.getElementById("btn" + i);

    document.querySelectorAll(".answers button").forEach(b => b.disabled = true);

    if (btn.textContent === currentAnswer) {
        correct++;
        btn.classList.add("correct");
        document.getElementById("status").textContent = "🎉 Đúng!";
    } else {
        wrong++;
        btn.classList.add("wrong");

        document.querySelectorAll(".answers button").forEach(correctBtn => {
            if (correctBtn.textContent === currentAnswer) {
                correctBtn.classList.add("correct");
            }
        });

        document.getElementById("status").textContent = `❌ Sai! Đáp án đúng: ${currentAnswer}`;
    }

    document.getElementById("correct").textContent = correct;
    document.getElementById("wrong").textContent = wrong;
}

function resetGame() {
    correct = wrong = total = 0;
    document.getElementById("correct").textContent = 0;
    document.getElementById("wrong").textContent = 0;
    document.getElementById("total").textContent = 0;
    document.getElementById("status").textContent = "Nhấn Bắt đầu cho câu tiếp theo.";
    const kanaElem = document.getElementById("kana");
    kanaElem.textContent = "?";
    clearInterval(scrambleInterval);
    document.querySelectorAll(".answers button").forEach(btn => { btn.textContent = ""; btn.classList.remove("correct", "wrong"); btn.disabled = false; });
}

renderGroupSwitches();

function toggleShowHideAns(t) {
    var isChecked = t.checked;
    var answerList = document.getElementById("answersBox");

    answerList.classList.toggle("hide");
}

// Thêm listener để gọi lại render khi resize (chuyển đổi mobile/desktop)
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        renderGroupSwitches();
    }, 100);
});