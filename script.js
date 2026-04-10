const video = document.getElementById("video");
const transcriptContainer = document.getElementById("transcriptScroll");
const commentsList = document.getElementById("commentsList");
const videoUpload = document.getElementById("videoUpload");
const videoTitle = document.getElementById("videoTitle");
const videoLength = document.getElementById("videoLength");
const commentsTimeLabel = document.getElementById("commentsTimeLabel");
const aiMessages = document.getElementById("aiMessages");
const summaryElement = document.getElementById("summary");
const takeawaysElement = document.getElementById("takeaways");
const summaryActionButton = document.getElementById("summaryActionButton");
const takeawaysActionButton = document.getElementById("takeawaysActionButton");
const aiActionButton = document.getElementById("aiActionButton");
const saveNotesButton = document.getElementById("saveNotesButton");
const aiInput = document.getElementById("aiInput");
const commentInput = document.getElementById("commentInput");
const quizContainer = document.getElementById("quizContainer");
const menuDropdown = document.getElementById("menuDropdown");
const transcriptMoreMenu = document.getElementById("transcriptMoreMenu");

let transcript = [
  { start: 0, end: 11, text: "Intro section of the video begins here." },
  { start: 11, end: 22, text: "This section continues the explanation." },
  { start: 22, end: 33, text: "An example or important point happens here." },
  { start: 33, end: 44, text: "More detail is added in this part." },
  { start: 44, end: 55, text: "The video moves toward a closing idea here." }
];

const summaryOptions = [
  "This video introduces the topic, gives useful background, shows an example, and ends with the main takeaway.",
  "The video starts with a simple overview, explains the core concept, walks through an example, and summarizes the key lesson.",
  "This video breaks the topic into clear parts: introduction, explanation, example, and final takeaway."
];

const takeawayOptions = [
  [
    "Understand the main idea before diving into details.",
    "Examples make the concept easier to remember.",
    "The final takeaway is usually the most important part."
  ],
  [
    "Start with the overview to build context.",
    "Watch closely when the example is introduced.",
    "Review the ending section to lock in the main lesson."
  ],
  [
    "Focus first on the core concept.",
    "Use examples to connect theory to practice.",
    "Summaries help you remember the important point."
  ]
];

const aiAnswerOptions = [
  "Here is a fresh placeholder response based on your question. Later, this can use the video transcript, notes, and comments to answer more intelligently.",
  "This is a regenerated placeholder answer. In the real version, the app could analyze the transcript and give a more specific response.",
  "This version gives you another sample answer. Once connected to a backend, it can answer using the actual content of the video."
];

let comments = [];
let aiHistory = [];
let summaryIndex = 0;
let takeawayIndex = 0;
let aiIndex = 0;
let hasSummary = false;
let hasTakeaways = false;
let hasAIResponse = false;
let activeTranscriptIndex = -1;
let saveButtonTimeout = null;

let currentQuiz = [];
let currentQuizIndex = 0;
let quizScore = 0;
let answeredQuestions = [];
let feedbackByQuestion = [];

function formatTime(seconds) {
  const safeSeconds = Math.floor(seconds || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  return `${hours}:${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

function toggleMenu() {
  menuDropdown.classList.toggle("open");
}

function goToDashboard() {
  closeMenu();
  switchTab("transcript");
}

function openUploadsPage() {
  closeMenu();
  window.location.href = "uploads.html";
}

function openFoldersPage() {
  closeMenu();
  window.location.href = "folders.html";
}

function openSettingsPage() {
  closeMenu();
  window.location.href = "settings.html";
}

function closeMenu() {
  menuDropdown.classList.remove("open");
}

function toggleTranscriptMoreMenu() {
  transcriptMoreMenu.classList.toggle("open");
}

function closeTranscriptMoreMenu() {
  transcriptMoreMenu.classList.remove("open");
}

document.addEventListener("click", (e) => {
  const wrapper = document.querySelector(".menu-wrapper");
  if (wrapper && !wrapper.contains(e.target)) {
    closeMenu();
  }

  const moreWrapper = document.querySelector(".more-menu-wrapper");
  if (moreWrapper && !moreWrapper.contains(e.target)) {
    closeTranscriptMoreMenu();
  }
});

function shareTranscript() {
  const text = transcript
    .map((seg) => `${formatTime(seg.start)} - ${formatTime(seg.end)}\n${seg.text}`)
    .join("\n\n");

  if (navigator.share) {
    navigator.share({
      title: `${videoTitle.textContent} Transcript`,
      text
    }).catch(() => {});
    return;
  }

  navigator.clipboard.writeText(text).catch(() => {});
}

function retranscribeFile() {
  closeTranscriptMoreMenu();
  if (!isNaN(video.duration)) {
    generateTranscriptFromDuration(video.duration);
  }
}

function renameTranscript() {
  closeTranscriptMoreMenu();
  const newName = prompt("Rename transcript:", `${videoTitle.textContent} Transcript`);
  if (!newName) return;
  videoTitle.textContent = newName;
}

function moveTranscript() {
  closeTranscriptMoreMenu();
  alert("Move feature coming soon.");
}

function deleteOriginalFile() {
  closeTranscriptMoreMenu();
  alert("Delete original file feature coming soon.");
}

function deleteTranscript() {
  closeTranscriptMoreMenu();
  transcript = [];
  renderTranscript();
}

function setButtonState(button, hasContent, generateLabel, regenerateLabel) {
  button.textContent = hasContent ? regenerateLabel : generateLabel;
  button.title = hasContent ? "Regenerate" : "Generate";
  button.setAttribute("aria-label", hasContent ? "Regenerate" : "Generate");
}

function updateActionButtons() {
  setButtonState(summaryActionButton, hasSummary, "+", "↻");
  setButtonState(takeawaysActionButton, hasTakeaways, "+", "↻");
  setButtonState(aiActionButton, hasAIResponse, "+", "↻");
}

function renderTranscript() {
  transcriptContainer.innerHTML = "";

  if (transcript.length === 0) {
    transcriptContainer.innerHTML = `<div class="empty-state">No transcript yet.</div>`;
    return;
  }

  transcript.forEach((seg, index) => {
    const item = document.createElement("div");
    item.className = "transcript-item";
    item.dataset.index = index;

    item.addEventListener("click", () => {
      video.currentTime = seg.start;
      video.play().catch(() => {});
      updateTranscriptHighlight();
    });

    const time = document.createElement("div");
    time.className = "timestamp";
    time.textContent = formatTime(seg.start);

    const text = document.createElement("div");
    text.className = "transcript-text";
    text.textContent = seg.text;

    item.appendChild(time);
    item.appendChild(text);
    transcriptContainer.appendChild(item);
  });
}

function generateTranscriptFromDuration(duration) {
  const segments = [];
  const step = 11;
  const roundedDuration = Math.floor(duration || 0);

  for (let start = 0; start < roundedDuration; start += step) {
    const end = Math.min(start + step, roundedDuration);
    segments.push({
      start,
      end,
      text: `Transcript segment from ${formatTime(start)} to ${formatTime(end)}.`
    });
  }

  if (segments.length === 0) {
    segments.push({
      start: 0,
      end: 11,
      text: "Transcript segment from 0:00:00 to 0:00:11."
    });
  }

  transcript = segments;
  renderTranscript();
}

function scrollTranscriptIntoView(activeElement) {
  const containerRect = transcriptContainer.getBoundingClientRect();
  const itemRect = activeElement.getBoundingClientRect();

  const isAbove = itemRect.top < containerRect.top;
  const isBelow = itemRect.bottom > containerRect.bottom;

  if (isAbove || isBelow) {
    activeElement.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}

function updateTranscriptHighlight() {
  const current = video.currentTime;
  const items = document.querySelectorAll(".transcript-item");

  let newActiveIndex = -1;

  items.forEach((item, index) => {
    const seg = transcript[index];

    if (current >= seg.start && current < seg.end) {
      item.classList.add("active-segment");
      newActiveIndex = index;
    } else {
      item.classList.remove("active-segment");
    }
  });

  if (newActiveIndex !== -1 && newActiveIndex !== activeTranscriptIndex) {
    activeTranscriptIndex = newActiveIndex;
    scrollTranscriptIntoView(items[newActiveIndex]);
  }
}

function createCommentElement(comment) {
  const commentDiv = document.createElement("div");
  commentDiv.className = "comment-card";

  const topDiv = document.createElement("div");
  topDiv.className = "comment-top";

  const timeDiv = document.createElement("div");
  timeDiv.className = "comment-time";
  timeDiv.textContent = formatTime(comment.time);
  timeDiv.onclick = () => {
    video.currentTime = comment.time;
    video.play().catch(() => {});
  };

  topDiv.appendChild(timeDiv);

  const textDiv = document.createElement("div");
  textDiv.className = "comment-text";
  textDiv.textContent = comment.text;

  const actionsDiv = document.createElement("div");
  actionsDiv.className = "comment-actions";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-button";
  deleteBtn.textContent = "Delete";
  deleteBtn.onclick = () => {
    deleteComment(comment.id);
  };

  actionsDiv.appendChild(deleteBtn);

  commentDiv.appendChild(topDiv);
  commentDiv.appendChild(textDiv);
  commentDiv.appendChild(actionsDiv);

  return commentDiv;
}

function renderComments() {
  commentsList.innerHTML = "";

  if (comments.length === 0) {
    commentsList.innerHTML = `<div class="empty-state">No comments yet.</div>`;
    return;
  }

  comments.forEach((comment) => {
    commentsList.appendChild(createCommentElement(comment));
  });

  commentsList.scrollTop = commentsList.scrollHeight;
}

function addComment() {
  const text = commentInput.value.trim();
  if (!text) return;

  comments.push({
    id: crypto.randomUUID(),
    time: video.currentTime,
    text
  });

  commentInput.value = "";
  renderComments();
}

function deleteComment(commentId) {
  comments = comments.filter((comment) => comment.id !== commentId);
  renderComments();
}

function switchTab(tabId, clickedButton = null) {
  const allTabs = document.querySelectorAll(".tab-content");
  const allButtons = document.querySelectorAll(".tab-button");

  allTabs.forEach((tab) => tab.classList.remove("active"));
  allButtons.forEach((btn) => btn.classList.remove("active"));

  if (clickedButton) {
    clickedButton.classList.add("active");
  } else {
    const map = {
      transcript: 0,
      notes: 1,
      comments: 2,
      ai: 3,
      quiz: 4
    };
    if (map[tabId] !== undefined) {
      allButtons[map[tabId]].classList.add("active");
    }
  }

  if (tabId === "transcript") {
    document.getElementById("transcriptTab").classList.add("active");
  } else if (tabId === "notes") {
    document.getElementById("notesTab").classList.add("active");
  } else if (tabId === "comments") {
    document.getElementById("commentsTab").classList.add("active");
  } else if (tabId === "ai") {
    document.getElementById("aiTab").classList.add("active");
  } else if (tabId === "quiz") {
    document.getElementById("quizTab").classList.add("active");
  }
}

function renderAI() {
  aiMessages.innerHTML = "";

  if (aiHistory.length === 0) {
    aiMessages.innerHTML = `<div class="empty-state">No questions yet.</div>`;
    return;
  }

  aiHistory.forEach((item) => {
    const questionBox = document.createElement("div");
    questionBox.className = "ai-message";

    const questionLabel = document.createElement("div");
    questionLabel.className = "ai-message-label";
    questionLabel.textContent = "You";

    const questionText = document.createElement("div");
    questionText.className = "ai-message-text";
    questionText.textContent = item.question;

    questionBox.appendChild(questionLabel);
    questionBox.appendChild(questionText);

    const answerBox = document.createElement("div");
    answerBox.className = "ai-message";

    const answerLabel = document.createElement("div");
    answerLabel.className = "ai-message-label";
    answerLabel.textContent = "AI";

    const answerText = document.createElement("div");
    answerText.className = "ai-message-text";
    answerText.textContent = item.answer;

    answerBox.appendChild(answerLabel);
    answerBox.appendChild(answerText);

    aiMessages.appendChild(questionBox);
    aiMessages.appendChild(answerBox);
  });

  aiMessages.scrollTop = aiMessages.scrollHeight;
}

function askAI() {
  const question = aiInput.value.trim();
  if (!question) return;

  const answer = aiAnswerOptions[aiIndex % aiAnswerOptions.length];
  aiIndex += 1;

  aiHistory.push({ question, answer });
  hasAIResponse = true;
  updateActionButtons();

  aiInput.value = "";
  renderAI();
}

function handleAIAction() {
  if (!hasAIResponse) {
    const question = aiInput.value.trim() || "Give me a quick overview of this video.";
    const answer = aiAnswerOptions[aiIndex % aiAnswerOptions.length];
    aiIndex += 1;

    aiHistory.push({ question, answer });
    hasAIResponse = true;
    updateActionButtons();
    renderAI();
    return;
  }

  regenerateAI();
}

function regenerateAI() {
  if (aiHistory.length === 0) return;

  const latestQuestion = aiHistory[aiHistory.length - 1].question;
  const newAnswer = aiAnswerOptions[aiIndex % aiAnswerOptions.length];
  aiIndex += 1;

  aiHistory[aiHistory.length - 1] = {
    question: latestQuestion,
    answer: newAnswer
  };

  hasAIResponse = true;
  updateActionButtons();
  renderAI();
}

function generateSummary() {
  summaryElement.textContent = summaryOptions[summaryIndex % summaryOptions.length];
  hasSummary = true;
  updateActionButtons();
}

function regenerateSummary() {
  summaryIndex += 1;
  summaryElement.textContent = summaryOptions[summaryIndex % summaryOptions.length];
  hasSummary = true;
  updateActionButtons();
}

function handleSummaryAction() {
  if (!hasSummary) {
    generateSummary();
  } else {
    regenerateSummary();
  }
}

function formatTakeaways(takeaways) {
  return takeaways.map((item) => `• ${item}`).join("\n");
}

function generateTakeaways() {
  const takeaways = takeawayOptions[takeawayIndex % takeawayOptions.length];
  takeawaysElement.textContent = formatTakeaways(takeaways);
  hasTakeaways = true;
  updateActionButtons();
}

function regenerateTakeaways() {
  takeawayIndex += 1;
  const takeaways = takeawayOptions[takeawayIndex % takeawayOptions.length];
  takeawaysElement.textContent = formatTakeaways(takeaways);
  hasTakeaways = true;
  updateActionButtons();
}

function handleTakeawaysAction() {
  if (!hasTakeaways) {
    generateTakeaways();
  } else {
    regenerateTakeaways();
  }
}

function saveNoteDoc() {
  if (saveButtonTimeout) {
    clearTimeout(saveButtonTimeout);
  }

  saveNotesButton.textContent = "✓";
  saveNotesButton.classList.add("saved-check");

  saveButtonTimeout = setTimeout(() => {
    saveNotesButton.textContent = "Save";
    saveNotesButton.classList.remove("saved-check");
  }, 2000);
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createQuestion(question, correctAnswer, wrongAnswers, explanation, topic) {
  return {
    question,
    correctAnswer,
    explanation,
    topic,
    options: shuffleArray([correctAnswer, ...wrongAnswers])
  };
}

function buildQuizFromTranscript() {
  const sentencePool = transcript.map((seg) => seg.text);

  const baseQuestions = [
    createQuestion(
      "What does the video begin with?",
      transcript[0]?.text || "An introduction",
      sentencePool.slice(1, 4).length ? sentencePool.slice(1, 4) : ["A random ending", "A comment section", "A blank screen"],
      "The first transcript segment represents the opening of the video.",
      "understanding the opening"
    ),
    createQuestion(
      "What happens later in the video?",
      transcript[Math.min(2, transcript.length - 1)]?.text || "More explanation",
      shuffleArray(sentencePool.filter((t) => t !== (transcript[Math.min(2, transcript.length - 1)]?.text || ""))).slice(0, 3),
      "This checks whether you can identify later transcript segments.",
      "following transcript order"
    )
  ];

  const dynamicQuestions = sentencePool.map((sentence, index) =>
    createQuestion(
      `Which transcript statement matches segment ${index + 1}?`,
      sentence,
      shuffleArray(sentencePool.filter((item) => item !== sentence)).slice(0, 3),
      `That segment says: "${sentence}"`,
      "matching transcript details"
    )
  );

  return shuffleArray([...baseQuestions, ...dynamicQuestions]).slice(0, 10);
}

function getImprovementAreas() {
  const wrongTopics = feedbackByQuestion
    .map((feedback, index) => {
      if (!feedback || feedback.isCorrect) return null;
      return currentQuiz[index].topic;
    })
    .filter(Boolean);

  const uniqueTopics = [...new Set(wrongTopics)];

  if (uniqueTopics.length === 0) {
    return ["You did well across all areas in this quiz."];
  }

  return uniqueTopics;
}

function finishQuiz() {
  const improveAreas = getImprovementAreas();

  quizContainer.innerHTML = `
    <div class="quiz-finished">
      <div class="quiz-score">You got ${quizScore} / ${currentQuiz.length}</div>
      <div class="quiz-summary-text">
        ${quizScore === currentQuiz.length
          ? "Great job. You answered every question correctly."
          : "Here’s what you should improve on based on the questions you missed:"}
      </div>
      <ul class="improve-list">
        ${improveAreas.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderCurrentQuizQuestion() {
  if (currentQuiz.length === 0) {
    quizContainer.innerHTML = `<div class="empty-state">No quiz yet.</div>`;
    return;
  }

  const item = currentQuiz[currentQuizIndex];
  const alreadyAnswered = answeredQuestions[currentQuizIndex];
  const savedFeedback = feedbackByQuestion[currentQuizIndex];
  const allAnswered = answeredQuestions.every(Boolean);
  const isLastQuestion = currentQuizIndex === currentQuiz.length - 1;

  quizContainer.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-progress">Question ${currentQuizIndex + 1} of ${currentQuiz.length}</div>
      <div class="quiz-question">${item.question}</div>

      <div class="quiz-options">
        ${item.options
          .map((option, index) => {
            let extraClass = "";
            if (alreadyAnswered && savedFeedback) {
              if (index === savedFeedback.selectedIndex && savedFeedback.isCorrect) {
                extraClass = "selected-correct";
              } else if (index === savedFeedback.selectedIndex && !savedFeedback.isCorrect) {
                extraClass = "selected-wrong";
              }
            }

            return `
              <button
                class="quiz-option ${extraClass}"
                onclick="handleQuizAnswer(${index})"
                ${alreadyAnswered ? "disabled" : ""}
              >
                ${String.fromCharCode(65 + index)}. ${option}
              </button>
            `;
          })
          .join("")}
      </div>

      <div id="quizFeedbackArea">
        ${
          savedFeedback
            ? `
          <div class="quiz-feedback">
            <div class="quiz-feedback-title ${savedFeedback.isCorrect ? "correct" : "wrong"}">
              ${savedFeedback.isCorrect ? "Correct" : "Wrong"}
            </div>
            <div class="quiz-feedback-text">
              ${!savedFeedback.isCorrect ? `<strong>Correct answer:</strong> ${item.correctAnswer}<br><br>` : ""}
              ${item.explanation}
            </div>
          </div>
        `
            : ""
        }
      </div>

      <div class="quiz-nav">
        <button class="quiz-arrow" onclick="goToPreviousQuestion()" ${currentQuizIndex === 0 ? "disabled" : ""}>←</button>
        <div class="quiz-status">${answeredQuestions.filter(Boolean).length} answered</div>
        ${
          isLastQuestion && allAnswered
            ? `<button class="quiz-arrow" onclick="finishQuiz()">✓</button>`
            : `<button class="quiz-arrow" onclick="goToNextQuestion()" ${alreadyAnswered ? "" : "disabled"}>→</button>`
        }
      </div>
    </div>
  `;
}

function handleQuizAnswer(selectedIndex) {
  if (!currentQuiz.length) return;
  if (answeredQuestions[currentQuizIndex]) return;

  const currentItem = currentQuiz[currentQuizIndex];
  const selectedAnswer = currentItem.options[selectedIndex];
  const isCorrect = selectedAnswer === currentItem.correctAnswer;

  if (isCorrect) {
    quizScore += 1;
  }

  answeredQuestions[currentQuizIndex] = true;
  feedbackByQuestion[currentQuizIndex] = {
    selectedIndex,
    isCorrect
  };

  renderCurrentQuizQuestion();
}

function goToPreviousQuestion() {
  if (currentQuizIndex > 0) {
    currentQuizIndex -= 1;
    renderCurrentQuizQuestion();
  }
}

function goToNextQuestion() {
  if (!answeredQuestions[currentQuizIndex]) return;
  if (currentQuizIndex < currentQuiz.length - 1) {
    currentQuizIndex += 1;
    renderCurrentQuizQuestion();
  }
}

function generateQuiz() {
  currentQuiz = buildQuizFromTranscript();
  currentQuizIndex = 0;
  quizScore = 0;
  answeredQuestions = new Array(currentQuiz.length).fill(false);
  feedbackByQuestion = new Array(currentQuiz.length).fill(null);
  renderCurrentQuizQuestion();
}

function exportTranscript() {
  const transcriptText = transcript
    .map((seg) => `${formatTime(seg.start)} - ${formatTime(seg.end)}\n${seg.text}`)
    .join("\n\n");

  const blob = new Blob([transcriptText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${videoTitle.textContent || "transcript"}-transcript.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

aiInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    askAI();
  }
});

commentInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    addComment();
  }
});

video.addEventListener("timeupdate", () => {
  commentsTimeLabel.textContent = formatTime(video.currentTime);
  updateTranscriptHighlight();
});

video.addEventListener("loadedmetadata", () => {
  if (!isNaN(video.duration)) {
    videoLength.textContent = formatTime(video.duration);
    generateTranscriptFromDuration(video.duration);
  }
});

videoUpload.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const fileURL = URL.createObjectURL(file);

  video.pause();
  video.src = fileURL;
  video.load();

  video.muted = false;
  video.loop = false;
  video.autoplay = false;

  const cleanName = file.name.replace(/\.[^/.]+$/, "");
  videoTitle.textContent = cleanName;
  videoLength.textContent = "0:00:00";

  video.onloadedmetadata = () => {
    videoLength.textContent = formatTime(video.duration);
    generateTranscriptFromDuration(video.duration);
    video.currentTime = 0;
    updateTranscriptHighlight();
  };
});

renderTranscript();
renderComments();
renderAI();
updateActionButtons();
commentsTimeLabel.textContent = formatTime(0);