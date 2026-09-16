const topicGroups = {
  "Everyday Life": ["Describe your ideal morning routine.","What small habit has improved your day?","Is it better to plan a day or be spontaneous?","What makes a place feel like home?","Talk about a meal that brings you comfort.","What is one thing you would simplify in daily life?","How do you recharge after a busy day?"],
  "Personal Experiences": ["Describe a moment when you felt proud of yourself.","Talk about a mistake that taught you something useful.","Describe a person who has influenced you.","What is a memory that always makes you smile?","Talk about a time you tried something new.","What challenge have you overcome recently?","Describe a trip or outing you enjoyed."],
  "Opinion": ["If you could change one thing about college education, what would it be?","Should students have fewer exams?","Is success more about effort or talent?","Should people take breaks from social media?","Is it important to have a five-year plan?","Should public transport be free for students?","What makes a good leader?"],
  "Technology": ["What technology has changed everyday life the most?","Should children have limits on screen time?","Are smart homes helpful or unnecessary?","What app could make your community better?","Is online learning as valuable as classroom learning?","How has technology changed friendship?","What device could you not live without and why?"],
  "AI": ["How could AI make learning more personal?","What is one responsible use of AI at work?","Should AI-created art be called art?","What should schools teach students about AI?","How can people use AI without becoming dependent on it?","What is one concern you have about AI?","Would you trust an AI tutor? Why or why not?"],
  "Education": ["What subject should every student learn?","Should schools teach financial literacy?","How can teachers make lessons more engaging?","Is homework helpful?","What is the best way to learn a difficult skill?","Should grades define a student's ability?","What would your ideal classroom look like?"],
  "Career": ["What is one skill every college student should learn?","Would you choose a job you love or a job that pays more?","What does a healthy work-life balance mean to you?","How should a person prepare for their first interview?","What quality makes a great teammate?","Would you rather work remotely or in an office?","What career would you explore if money were not a concern?"],
  "Environment": ["What can one person do to reduce waste?","Should cities create more green spaces?","How can schools become more environmentally friendly?","Is fast fashion a serious problem?","Should single-use plastics be banned?","How can travel become more sustainable?","What natural place would you like to protect?"],
  "Society": ["What makes a community feel welcoming?","How can people be kinder online?","Should volunteering be part of education?","What does equality mean to you?","How can young people make their voices heard?","Is privacy more important than convenience?","What social change would you like to see?"],
  "Creativity": ["What does creativity mean to you?","Should everyone have a creative hobby?","If you could design a new festival, what would it celebrate?","How do limitations make ideas more creative?","What is a creative solution to boredom?","Can failure improve creativity?","What would you create if you had unlimited resources?"],
  "Hypothetical Situations": ["If you could live in any decade, which would you choose?","If you had an extra hour every day, how would you use it?","If you could solve one world problem, what would it be?","If you could instantly learn one language, which one?","If you were mayor for a day, what would you change?","If you could swap lives with anyone for a day, who would it be?","If you could send one message to your younger self, what would you say?"],
  "Debate": ["Should phones be allowed in classrooms?","Is competition more helpful than collaboration?","Should public speaking be compulsory in college?","Are books better than movies?","Should voting be mandatory?","Is working four days a week a good idea?","Should universities offer free education?"],
  "Storytelling": ["Tell a story about an unexpected surprise.","Describe a day when everything went wrong but ended well.","Tell a story beginning with: 'The message was not meant for me.'","Describe a childhood adventure.","Tell a story about finding something lost.","Create a story about a door that appears only at midnight.","Tell a story about meeting a future version of yourself."],
  "Interview": ["Tell me about yourself.","What is your greatest strength?","How do you handle feedback?","Describe a time you solved a problem.","Why do you want this opportunity?","How do you work in a team?","What would you like to learn in the next year?"],
  "Abstract/Thought-provoking": ["What does confidence mean to you?","Is silence ever more powerful than words?","What is the difference between being busy and being productive?","Can people truly change?","What makes a life meaningful?","Is happiness a choice?","What does freedom mean in everyday life?"]
};
const difficultyCycle = ["Beginner","Intermediate","Advanced","Beginner","Intermediate","Advanced","Intermediate"];
const TOPIC_BANK = Object.entries(topicGroups).flatMap(([category, topics]) => topics.map((topic, index) => ({ id: `${category.toLowerCase().replace(/[^a-z]+/g,"-")}-${index + 1}`, topic, category, difficulty: difficultyCycle[index], duration: 120 })));
let currentSpotTopic = null;
let mediaRecorder = null;
let audioChunks = [];
let recordedAudioURL = null;
const questions = [
  "Tell me a little about yourself.",
  "What is one strength you are proud of?",
  "Why would you like this opportunity?",
  "Tell me about a challenge you handled.",
  "What would you like to learn next?"
];
const dailyReminders = [
  "Today is different. Tomorrow will be different too—and you can take both days one small step at a time.",
  "You do not need to sound perfect. You only need to begin.",
  "A quiet voice can still carry a powerful idea.",
  "Bravery can be as small as saying one sentence.",
  "It is okay to pause, think, and then speak.",
  "You are learning, not performing. Be kind to yourself today.",
  "Confidence grows every time you give yourself a chance."
];
const emptyState = {
  coins: 0,
  sessions: 0,
  streak: 0,
  lastPractice: null
};
let isLoggedIn =
  sessionStorage.getItem("vexoraLoggedIn") === "true";
const state = isLoggedIn
  ? JSON.parse(localStorage.getItem("vexoraProgress")) || { ...emptyState }
  : { ...emptyState };
let questionIndex = 0;
let timeRemaining = 60;
let timerId;
let speakingTimerId = null;
let speakingTimeRemaining = 60;

function saveState() {
  if (!isLoggedIn) return;
  localStorage.setItem(
    "vexoraProgress",
    JSON.stringify(state)
  );
}
function updateStats() {
  document.querySelectorAll("#coin-count, #gd-coin-count, #progress-coins").forEach(el => el.textContent = state.coins);
  document.querySelectorAll("#streak-count, #progress-streak").forEach(el => el.textContent = state.streak);
  document.querySelector("#progress-sessions").textContent = state.sessions;
  document.querySelector("#gd-locked").classList.toggle("hidden", state.coins >= 20);
  document.querySelector("#gd-unlocked").classList.toggle("hidden", state.coins < 20);
}
function showToast(message) { const toast = document.querySelector("#toast"); toast.textContent = message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 3200); }
function goTo(id) {
  document.querySelectorAll(".view").forEach(view => {
    view.classList.toggle("active", view.id === id);
  });

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.go === id ||
      (
        id !== "home" &&
        button.dataset.go === "practice" &&
        ["interview", "speech", "gd", "spot"].includes(id)
      )
    );
  });

  document.querySelector(".app-shell").classList.toggle(
    "login-mode",
    id === "login"
  );

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  if (id === "gd" || id === "progress") {
    updateStats();
  }
}
function completePractice(coins, message) {

  if (!isLoggedIn) {
    showToast("Log in to save your progress.");
    goTo("home");
    return;
  }

  const today = new Date().toDateString();
  const yesterday = new Date(
    Date.now() - 86400000
  ).toDateString();

  if (state.lastPractice !== today) {
    state.streak =
      state.lastPractice === yesterday
        ? state.streak + 1
        : 1;
  }
  state.lastPractice = today;
  state.coins += coins;
  state.sessions += 1;
  saveState();
  updateStats();
  showToast(
    `${message} You earned ${coins} coins!`
  );
  goTo("home");
}
function updateQuestion() { document.querySelector("#interview-question").textContent = questions[questionIndex]; document.querySelector("#question-progress").textContent = `${questionIndex + 1} of ${questions.length}`; document.querySelector("#interview-answer").value = ""; }
function nextQuestion() { if (questionIndex < questions.length - 1) { questionIndex += 1; updateQuestion(); } else { questionIndex = 0; updateQuestion(); completePractice(10, "Wonderful work—your interview practice is complete."); } }
function updateTimer() { const minutes = String(Math.floor(timeRemaining / 60)).padStart(2, "0"); const seconds = String(timeRemaining % 60).padStart(2, "0"); document.querySelector("#timer").textContent = `${minutes}:${seconds}`; }
function updateSpotDuration() {
  const duration = Number(
    document.querySelector("#spot-duration").value);
  const minutes = duration / 60;

  document.querySelector("#spot-speaking-time").textContent =
    `${minutes} minute${minutes !== 1 ? "s" : ""}`;

  document.querySelector("#speaking-timer").textContent =
    `${String(minutes).padStart(2, "0")}:00`;
}
function setDailyReminder() {
  const today = new Date();
  const dayNumber = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000);
  document.querySelector("#daily-reminder").textContent = dailyReminders[dayNumber % dailyReminders.length];
}
function populateSpotCategories() {
  const categorySelect = document.querySelector("#spot-category");

  Object.keys(topicGroups).forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}
function getRandomSpotTopic() {
  const difficulty = document.querySelector("#spot-difficulty").value;
  const category = document.querySelector("#spot-category").value;
  let availableTopics = TOPIC_BANK;
  if (difficulty !== "All Levels") {availableTopics = availableTopics.filter(topic => topic.difficulty === difficulty);}
  if (category !== "All") {availableTopics = availableTopics.filter(topic => topic.category === category);}
  if (availableTopics.length === 0) return;
  const topicElement = document.querySelector("#spot-topic");
  let flashes = 0;
  const totalFlashes = 20;
  function spin() {const randomTopic =availableTopics[Math.floor(Math.random() * availableTopics.length)];topicElement.textContent = randomTopic.topic;
   flashes++;
   if (flashes >= totalFlashes) {currentSpotTopic =availableTopics[Math.floor(Math.random() * availableTopics.length)];
    topicElement.textContent = currentSpotTopic.topic;
    document.querySelector("#spot-category-label").textContent =currentSpotTopic.category;
    document.querySelector("#spot-difficulty-label").textContent =currentSpotTopic.difficulty;return;}
    const delay = 60 + flashes * 15;
    setTimeout(spin, delay);}
    spin();
}
function updateSpeakingTimer() {const minutes = String(Math.floor(speakingTimeRemaining / 60)).padStart(2, "0");
  const seconds = String(speakingTimeRemaining % 60).padStart(2, "0");
  document.querySelector("#spot-live-timer").textContent =`${minutes}:${seconds}`;
}
function startSpeakingSession() {if (!currentSpotTopic) {getRandomSpotTopic();}
const duration =Number(document.querySelector("#spot-duration").value);
speakingTimeRemaining = duration;
document.querySelector("#active-speaking-topic").textContent =currentSpotTopic.topic;
document.querySelector("#speaking-status").textContent ="🎤 Speak now!";
updateSpeakingTimer();
goTo("speaking-page");
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    mediaRecorder.start();
    document.querySelector("#speaking-status").textContent =
      "Recording... Speak now!";
  })
  .catch(error => {
    console.error("Microphone error:", error);
    document.querySelector("#speaking-status").textContent =
      "Microphone access was denied.";
  });
clearInterval(speakingTimerId);
speakingTimerId = setInterval(() => {speakingTimeRemaining--;
updateSpeakingTimer();
if (speakingTimeRemaining <= 0) {
      finishSpeakingSession();
    }
  }, 1000);
}
function finishSpeakingSession() {clearInterval(speakingTimerId);speakingTimerId = null;
document.querySelector("#speaking-status").textContent ="✨ Speaking session complete!";
document.querySelector("#finish-speaking").textContent="Done";
}
document.querySelector("#start-speaking").addEventListener("click",startSpeakingSession);
document.querySelector("#finish-speaking").addEventListener("click",finishSpeakingSession);
document.querySelector("#new-topic").addEventListener("click", getRandomSpotTopic);
document.querySelector("#spot-difficulty").addEventListener("change", getRandomSpotTopic);
document.querySelector("#spot-category").addEventListener("change", getRandomSpotTopic);
document.querySelector("#spot-duration").addEventListener("change", updateSpotDuration);
document.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () => goTo(button.dataset.go)));
document.querySelector("#next-question").addEventListener("click", nextQuestion);
document.querySelector("#skip-question").addEventListener("click", nextQuestion);
document.querySelector("#timer-button").addEventListener("click", event => {
  if (timerId) { clearInterval(timerId); timerId = null; event.currentTarget.textContent = "Continue timer"; return; }
  event.currentTarget.textContent = "Pause timer";
  timerId = setInterval(() => { timeRemaining -= 1; updateTimer(); if (timeRemaining <= 0) { clearInterval(timerId); timerId = null; event.currentTarget.textContent = "Time's up — nice work!"; showToast("One minute done. Take a moment to be proud of yourself."); } }, 1000);
});
document.querySelector("#complete-speech").addEventListener("click", () => { clearInterval(timerId); timerId = null; timeRemaining = 60; updateTimer(); document.querySelector("#timer-button").textContent = "Start timer"; document.querySelector("#speech-notes").value = ""; completePractice(8, "You showed up and spoke—that is progress."); });
document.querySelector("#complete-gd").addEventListener("click", () => completePractice(6, "Great job practising your group-discussion voice."));
populateSpotCategories();
getRandomSpotTopic();
updateQuestion();updateTimer();updateStats();setDailyReminder();updateSpotDuration();