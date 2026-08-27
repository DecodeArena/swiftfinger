// ============================================================
// SWIFTFINGER ⚡
// Telegram Mini App + Supabase Connection
// ============================================================

const SUPABASE_URL =
  "https://skceglrwxcdkyktbzmnq.supabase.co";

const TELEGRAM_AUTH_FUNCTION =
  `${SUPABASE_URL}/functions/v1/telegram-auth`;


// ============================================================
// TELEGRAM MINI APP
// ============================================================

const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}


// ============================================================
// SWIFTFINGER CONFIG
// ============================================================

const SwiftFingerConfig = {

  currentWinners: 3,

  futureWinners: 100,

  currentPrizePool: 30,

  futurePrizePool: 0,

  announcementEnabled: true,

  announcementFrequency: "once_per_day"

};


// ============================================================
// PLAYER
// ============================================================

const player = {

  id: null,

  telegramId: null,

  username: "Player",

  firstName: "",

  lastName: "",

  photoUrl: "",

  wins: 0,

  losses: 0,

  winStreak: 0,

  rating: 1000,

  totalMatches: 0

};


// ============================================================
// MATCH STATE
// ============================================================

const match = {

  id: null,

  opponent: null,

  attemptsRemaining: 5,

  active: false,

  consecutiveMatches: 0,

  cooldownUntil: null

};


// ============================================================
// SCREEN NAVIGATION
// ============================================================

function openScreen(screenId) {

  document
    .querySelectorAll(".screen")
    .forEach(screen => {

      screen.classList.remove("active");

    });


  const target =
    document.getElementById(screenId);


  if (target) {

    target.classList.add("active");

  }


  window.scrollTo({

    top: 0,

    behavior: "smooth"

  });

}


function goHome() {

  openScreen("homeScreen");

}


// ============================================================
// TELEGRAM AUTHENTICATION
// ============================================================

async function authenticateTelegramUser() {

  if (!tg) {

    console.warn(
      "Telegram WebApp object not available."
    );

    return false;

  }


  const telegramUser =
    tg.initDataUnsafe?.user;


  if (!telegramUser) {

    console.warn(
      "No Telegram user information available."
    );

    return false;

  }


  player.telegramId =
    telegramUser.id;

  player.username =
    telegramUser.username
      ? "@" + telegramUser.username
      : (
        telegramUser.first_name ||
        "Player"
      );

  player.firstName =
    telegramUser.first_name || "";

  player.lastName =
    telegramUser.last_name || "";

  player.photoUrl =
    telegramUser.photo_url || "";


  try {

    const response =
      await fetch(
        TELEGRAM_AUTH_FUNCTION,
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body: JSON.stringify({

            telegram_user:
              telegramUser,

            init_data:
              tg.initData

          })

        }
      );


    const data =
      await response.json();


    if (!response.ok || !data.success) {

      console.error(
        "Telegram authentication failed:",
        data
      );

      return false;

    }


    if (data.player) {

      applyPlayerData(
        data.player
      );

    }


    console.log(
      "SwiftFinger player authenticated."
    );


    return true;


  } catch (error) {

    console.error(
      "Authentication request failed:",
      error
    );

    return false;

  }

}


// ============================================================
// APPLY PLAYER DATA
// ============================================================

function applyPlayerData(data) {

  if (!data) {

    return;

  }


  player.id =
    data.id ?? player.id;

  player.telegramId =
    data.telegram_id ?? player.telegramId;

  player.username =
    data.telegram_username
      ? "@" + data.telegram_username
      : player.username;

  player.firstName =
    data.first_name ?? player.firstName;

  player.lastName =
    data.last_name ?? player.lastName;

  player.photoUrl =
    data.photo_url ?? player.photoUrl;

  player.wins =
    data.wins ?? 0;

  player.losses =
    data.losses ?? 0;

  player.winStreak =
    data.win_streak ?? 0;

  player.rating =
    data.rating ?? 1000;

  player.totalMatches =
    data.total_matches ?? 0;


  saveLocalPlayer();

  updateProfile();

}


// ============================================================
// MATCHMAKING
// ============================================================

function startMatchmaking() {

  if (isPairCooldownActive()) {

    showToast(
      "You cannot rematch this opponent yet."
    );

    return;

  }


  openScreen(
    "matchmakingScreen"
  );


  match.active = false;


  /*
    TEMPORARY MATCHMAKING

    Real matchmaking will be moved to the
    secure backend.

    We do NOT trust browser-side matchmaking
    for the real competition.
  */


  setTimeout(() => {

    match.opponent = {

      id:
        "temporary-opponent",

      username:
        "SwiftFinger Player"

    };


    match.attemptsRemaining =
      5;

    match.active =
      true;


    updateOpponentDisplay();

    updateAttemptDisplay();

    openScreen(
      "matchScreen"
    );


  }, 1800);

}


// ============================================================
// OPPONENT DISPLAY
// ============================================================

function updateOpponentDisplay() {

  const element =
    document.getElementById(
      "opponentName"
    );


  if (
    element &&
    match.opponent
  ) {

    element.innerText =
      match.opponent.username;

  }

}


// ============================================================
// ATTEMPTS
// ============================================================

function updateAttemptDisplay() {

  const element =
    document.getElementById(
      "attempts"
    );


  if (element) {

    element.innerText =
      match.attemptsRemaining;

  }

}


// ============================================================
// SUBMIT 1v1 ATTEMPT
// ============================================================

function submitAttempt() {

  if (!match.active) {

    showToast(
      "There is no active match."
    );

    return;

  }


  if (
    match.attemptsRemaining <= 0
  ) {

    showToast(
      "Your 5 attempts are finished."
    );

    return;

  }


  const input =
    document.getElementById(
      "gameAnswer"
    );


  const feedback =
    document.getElementById(
      "gameFeedback"
    );


  const answer =
    input.value.trim();


  if (!answer) {

    feedback.innerText =
      "Enter your answer first.";

    feedback.style.color =
      "#ffbd4a";

    return;

  }


  match.attemptsRemaining--;

  updateAttemptDisplay();


  /*
    TEMPORARY DEMONSTRATION ONLY.

    This answer must NOT be used for the
    real competition.

    Later, the secure backend will validate
    the answer.
  */


  const temporaryAnswer =
    "dance grows pineapple";


  if (
    normalize(answer) ===
    normalize(temporaryAnswer)
  ) {

    feedback.innerText =
      "⚡ Correct!";

    feedback.style.color =
      "#27d17f";


    handleMatchWin();

    return;

  }


  feedback.innerText =
    "❌ Incorrect. Try again.";

  feedback.style.color =
    "#ff647c";


  if (
    match.attemptsRemaining === 0
  ) {

    handleMatchLoss();

  }

}


// ============================================================
// NORMALIZE ANSWER
// ============================================================

function normalize(value) {

  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

}


// ============================================================
// MATCH WIN
// ============================================================

function handleMatchWin() {

  match.active =
    false;


  player.wins++;

  player.winStreak++;

  player.rating += 20;

  player.totalMatches++;

  match.consecutiveMatches++;


  saveLocalPlayer();

  updateProfile();


  showToast(
    "🏆 Victory! Rating +20"
  );


  setTimeout(() => {

    openScreen(
      "profileScreen"
    );

  }, 1200);

}


// ============================================================
// MATCH LOSS
// ============================================================

function handleMatchLoss() {

  match.active =
    false;


  player.losses++;

  player.winStreak =
    0;

  player.rating =
    Math.max(
      0,
      player.rating - 15
    );

  player.totalMatches++;

  match.consecutiveMatches++;


  saveLocalPlayer();

  updateProfile();


  showToast(
    "Match over. Better luck next time."
  );


  setTimeout(() => {

    openScreen(
      "profileScreen"
    );

  }, 1200);

}


// ============================================================
// REMATCH
// ============================================================

function rematchSameOpponent() {

  if (
    match.consecutiveMatches >= 3
  ) {

    activatePairCooldown();

    showToast(
      "3 consecutive matches reached. 1h 30m cooldown."
    );

    return;

  }


  startMatchmaking();

}


// ============================================================
// PAIR COOLDOWN
// ============================================================

function activatePairCooldown() {

  const duration =
    90 * 60 * 1000;


  match.cooldownUntil =
    Date.now() + duration;

}


function isPairCooldownActive() {

  if (!match.cooldownUntil) {

    return false;

  }


  if (
    Date.now() >=
    match.cooldownUntil
  ) {

    match.cooldownUntil =
      null;

    match.consecutiveMatches =
      0;

    return false;

  }


  return true;

}


// ============================================================
// DECODE NUMBERS
// ============================================================

function submitDecode() {

  const input =
    document.getElementById(
      "decodeAnswer"
    );


  const feedback =
    document.getElementById(
      "decodeFeedback"
    );


  const answer =
    input.value.trim();


  if (!answer) {

    feedback.innerText =
      "Enter your answer.";

    feedback.style.color =
      "#ffbd4a";

    return;

  }


  /*
    TEMPORARY DEMONSTRATION.

    Real Decode Numbers validation will
    happen through the secure backend.
  */


  const temporaryAnswer =
    "dance grows pineapple";


  if (
    normalize(answer) ===
    normalize(temporaryAnswer)
  ) {

    feedback.innerText =
      "✅ Correct!";

    feedback.style.color =
      "#27d17f";


    showToast(
      "🎉 Decode completed!"
    );

  } else {

    feedback.innerText =
      "❌ Incorrect. Try again.";

    feedback.style.color =
      "#ff647c";

  }

}


// ============================================================
// LEADERBOARD
// ============================================================

function changeBoard(button) {

  document
    .querySelectorAll(".tab")
    .forEach(tab => {

      tab.classList.remove(
        "active"
      );

    });


  button.classList.add(
    "active"
  );


  loadLeaderboard(
    button.innerText
  );

}


function loadLeaderboard(type) {

  const leaderboard =
    document.getElementById(
      "leaderboard"
    );


  if (!leaderboard) {

    return;

  }


  /*
    TEMPORARY DISPLAY DATA.

    Real leaderboard data will come from
    Supabase after the secure game system
    is completed.
  */


  const players = [

    {
      rank: 1,
      name: "Swift Champion",
      username: "@champion",
      wins: 12,
      rating: 1250
    },

    {
      rank: 2,
      name: "Lightning",
      username: "@lightning",
      wins: 10,
      rating: 1205
    },

    {
      rank: 3,
      name: "Swift Player",
      username: "@swift",
      wins: 8,
      rating: 1170
    }

  ];


  leaderboard.innerHTML = "";


  players.forEach(item => {

    leaderboard.innerHTML += `

      <div class="leaderboard-row">

        <div class="rank">
          ${item.rank}
        </div>

        <div class="player-info">

          <strong>
            ${item.name}
          </strong>

          <small>
            ${item.username}
          </small>

        </div>

        <div class="player-score">

          ${item.wins} wins

          <small>
            ${item.rating} rating
          </small>

        </div>

      </div>

    `;

  });

}


// ============================================================
// PROFILE
// ============================================================

function updateProfile() {

  const profile =
    document.getElementById(
      "profileScreen"
    );


  if (!profile) {

    return;

  }


  const stats =
    profile.querySelectorAll(
      ".stat strong"
    );


  if (stats.length >= 4) {

    stats[0].innerText =
      player.wins;

    stats[1].innerText =
      player.losses;

    stats[2].innerText =
      player.winStreak;

    stats[3].innerText =
      player.rating;

  }


  updateTelegramProfileName();

}


// ============================================================
// PROFILE NAME
// ============================================================

function updateTelegramProfileName() {

  const profile =
    document.getElementById(
      "profileScreen"
    );


  if (!profile) {

    return;

  }


  const heading =
    profile.querySelector(
      ".profile-card h2"
    );


  const username =
    profile.querySelector(
      ".profile-card .username"
    );


  if (heading) {

    heading.innerText =
      player.username;

  }


  if (username) {

    username.innerText =
      player.username;

  }

}


// ============================================================
// LOCAL STORAGE
// ============================================================

function saveLocalPlayer() {

  try {

    localStorage.setItem(

      "swiftfinger_player",

      JSON.stringify(player)

    );

  } catch (error) {

    console.log(
      "Local storage unavailable."
    );

  }

}


function loadLocalPlayer() {

  try {

    const saved =
      localStorage.getItem(
        "swiftfinger_player"
      );


    if (!saved) {

      return;

    }


    const data =
      JSON.parse(saved);


    Object.assign(
      player,
      data
    );


  } catch (error) {

    console.log(
      "Unable to load player."
    );

  }

}


// ============================================================
// ANNOUNCEMENT POPUP
// ============================================================

function openAnnouncement() {

  const popup =
    document.getElementById(
      "announcementPopup"
    );


  if (!popup) {

    return;

  }


  popup.classList.remove(
    "hidden"
  );


  updateAnnouncementValues();

}


function closeAnnouncement() {

  const popup =
    document.getElementById(
      "announcementPopup"
    );


  if (!popup) {

    return;

  }


  popup.classList.add(
    "hidden"
  );


  rememberAnnouncement();

}


function updateAnnouncementValues() {

  const current =
    document.getElementById(
      "popupCurrentWinners"
    );


  const future =
    document.getElementById(
      "popupFutureWinners"
    );


  if (current) {

    current.innerText =
      `Top ${SwiftFingerConfig.currentWinners}`;

  }


  if (future) {

    future.innerText =
      `Top ${SwiftFingerConfig.futureWinners}`;

  }

}


// ============================================================
// ANNOUNCEMENT FREQUENCY
// ============================================================

function rememberAnnouncement() {

  try {

    localStorage.setItem(

      "swiftfinger_announcement_seen",

      Date.now().toString()

    );

  } catch (error) {

    console.log(
      "Unable to save announcement state."
    );

  }

}


function shouldShowAnnouncement() {

  if (
    !SwiftFingerConfig
      .announcementEnabled
  ) {

    return false;

  }


  try {

    const lastSeen =
      Number(
        localStorage.getItem(
          "swiftfinger_announcement_seen"
        )
      );


    if (!lastSeen) {

      return true;

    }


    const day =
      24 * 60 * 60 * 1000;


    if (
      SwiftFingerConfig
        .announcementFrequency ===
      "once_per_day"
    ) {

      return (
        Date.now() -
        lastSeen >=
        day
      );

    }


  } catch (error) {

    return true;

  }


  return true;

}


// ============================================================
// RULES
// ============================================================

function showRules() {

  showToast(
    "5 attempts • No draws • Unlimited rematches"
  );

}


// ============================================================
// TOAST
// ============================================================

function showToast(message) {

  const toast =
    document.getElementById(
      "toast"
    );


  if (!toast) {

    return;

  }


  toast.innerText =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    window.swiftFingerToast
  );


  window.swiftFingerToast =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 2500);

}


// ============================================================
// TELEGRAM BACK BUTTON
// ============================================================

function setupTelegramBackButton() {

  if (!tg) {

    return;

  }


  if (tg.BackButton) {

    tg.BackButton.onClick(
      goHome
    );

  }

}


// ============================================================
// INITIALIZATION
// ============================================================

async function initializeSwiftFinger() {

  loadLocalPlayer();

  setupTelegramBackButton();

  updateProfile();


  /*
    Authenticate the Telegram user.

    This happens after the basic UI has loaded
    so the interface doesn't remain frozen
    while waiting for the network.
  */

  await authenticateTelegramUser();


  updateProfile();


  if (
    shouldShowAnnouncement()
  ) {

    setTimeout(
      openAnnouncement,
      500
    );

  }

}


// ============================================================
// START APP
// ============================================================

document.addEventListener(

  "DOMContentLoaded",

  initializeSwiftFinger

);
};


// -------------------------------
// Player state
// -------------------------------

const player = {

  id: null,
  username: "Player",

  wins: 0,
  losses: 0,

  winStreak: 0,

  rating: 1000

};


// -------------------------------
// Match state
// -------------------------------

const match = {

  attemptsRemaining: 5,

  opponent: null,

  active: false,

  consecutiveMatches: 0,

  cooldownUntil: null

};


// ==========================================
// SCREEN NAVIGATION
// ==========================================

function openScreen(screenId) {

  document
    .querySelectorAll(".screen")
    .forEach(screen => {

      screen.classList.remove("active");

    });


  const target =
    document.getElementById(screenId);


  if (target) {

    target.classList.add("active");

  }


  window.scrollTo({

    top: 0,

    behavior: "smooth"

  });

}


// ==========================================
// HOME
// ==========================================

function goHome() {

  openScreen("homeScreen");

}


// ==========================================
// MATCHMAKING
// ==========================================

function startMatchmaking() {

  if (isPairCooldownActive()) {

    showToast(
      "You cannot rematch this opponent yet."
    );

    return;

  }


  openScreen("matchmakingScreen");


  match.active = false;


  // Temporary matchmaking simulation.
  //
  // Real matchmaking will eventually happen
  // through the backend.

  setTimeout(() => {

    match.opponent = {

      id: "temporary-opponent",

      username: "SwiftFinger Player"

    };


    match.attemptsRemaining = 5;

    match.active = true;


    updateAttemptDisplay();

    openScreen("matchScreen");

  }, 1800);

}


// ==========================================
// ATTEMPTS
// ==========================================

function updateAttemptDisplay() {

  const element =
    document.getElementById("attempts");


  if (element) {

    element.innerText =
      match.attemptsRemaining;

  }

}


// ==========================================
// SUBMIT 1v1 ATTEMPT
// ==========================================

function submitAttempt() {

  if (!match.active) {

    showToast(
      "There is no active match."
    );

    return;

  }


  if (match.attemptsRemaining <= 0) {

    showToast(
      "Your 5 attempts are finished."
    );

    return;

  }


  const input =
    document.getElementById("gameAnswer");


  const feedback =
    document.getElementById("gameFeedback");


  const answer =
    input.value.trim();


  if (!answer) {

    feedback.innerText =
      "Enter your answer first.";

    feedback.style.color =
      "#ffbd4a";

    return;

  }


  match.attemptsRemaining--;

  updateAttemptDisplay();


  /*
    IMPORTANT:

    This answer checking is ONLY a temporary
    demonstration.

    The real answer will be checked by the
    secure backend.

    Players should never be able to determine
    the correct answer by inspecting the
    browser code.
  */


  const correctAnswer =
    "dance grows pineapple";


  if (
    normalize(answer) ===
    normalize(correctAnswer)
  ) {

    feedback.innerText =
      "⚡ Correct!";

    feedback.style.color =
      "#27d17f";


    handleMatchWin();

    return;

  }


  feedback.innerText =
    "❌ Incorrect. Try again.";

  feedback.style.color =
    "#ff647c";


  if (
    match.attemptsRemaining === 0
  ) {

    handleMatchLoss();

  }

}


// ==========================================
// NORMALIZE ANSWERS
// ==========================================

function normalize(value) {

  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

}


// ==========================================
// MATCH WIN
// ==========================================

function handleMatchWin() {

  match.active = false;


  player.wins++;

  player.winStreak++;


  // Temporary rating calculation.

  player.rating += 20;


  match.consecutiveMatches++;


  saveLocalPlayer();


  showToast(
    "🏆 Victory! Rating +20"
  );


  setTimeout(() => {

    openScreen("profileScreen");

    updateProfile();

  }, 1200);

}


// ==========================================
// MATCH LOSS
// ==========================================

function handleMatchLoss() {

  match.active = false;


  player.losses++;

  player.winStreak = 0;


  player.rating =
    Math.max(
      0,
      player.rating - 15
    );


  match.consecutiveMatches++;


  saveLocalPlayer();


  showToast(
    "Match over. Better luck next time."
  );


  setTimeout(() => {

    openScreen("profileScreen");

    updateProfile();

  }, 1200);

}


// ==========================================
// REMATCH
// ==========================================

function rematchSameOpponent() {

  if (
    match.consecutiveMatches >= 3
  ) {

    activatePairCooldown();

    showToast(
      "3 consecutive matches reached. 1h 30m cooldown."
    );

    return;

  }


  startMatchmaking();

}


// ==========================================
// PAIR COOLDOWN
// ==========================================

function activatePairCooldown() {

  const duration =
    90 * 60 * 1000;


  match.cooldownUntil =
    Date.now() + duration;

}


function isPairCooldownActive() {

  if (!match.cooldownUntil) {

    return false;

  }


  if (
    Date.now() >=
    match.cooldownUntil
  ) {

    match.cooldownUntil = null;

    match.consecutiveMatches = 0;

    return false;

  }


  return true;

}


// ==========================================
// DECODE NUMBERS
// ==========================================

function submitDecode() {

  const input =
    document.getElementById(
      "decodeAnswer"
    );


  const feedback =
    document.getElementById(
      "decodeFeedback"
    );


  const answer =
    input.value.trim();


  if (!answer) {

    feedback.innerText =
      "Enter your answer.";

    feedback.style.color =
      "#ffbd4a";

    return;

  }


  /*
    Temporary demonstration answer.

    Later the server will verify the answer.
  */

  const correctAnswer =
    "dance grows pineapple";


  if (
    normalize(answer) ===
    normalize(correctAnswer)
  ) {

    feedback.innerText =
      "✅ Correct!";

    feedback.style.color =
      "#27d17f";


    showToast(
      "🎉 Decode completed!"
    );

  } else {

    feedback.innerText =
      "❌ Incorrect. Try again.";

    feedback.style.color =
      "#ff647c";

  }

}


// ==========================================
// LEADERBOARD
// ==========================================

function changeBoard(button) {

  document
    .querySelectorAll(".tab")
    .forEach(tab => {

      tab.classList.remove("active");

    });


  button.classList.add("active");


  const type =
    button.innerText;


  loadLeaderboard(type);

}


// ==========================================
// TEMPORARY LEADERBOARD
// ==========================================

function loadLeaderboard(type) {

  const leaderboard =
    document.getElementById(
      "leaderboard"
    );


  if (!leaderboard) {

    return;

  }


  const players = [

    {
      rank: 1,
      name: "Swift Champion",
      username: "@champion",
      wins: 12,
      rating: 1250
    },

    {
      rank: 2,
      name: "Lightning",
      username: "@lightning",
      wins: 10,
      rating: 1205
    },

    {
      rank: 3,
      name: "Swift Player",
      username: "@swift",
      wins: 8,
      rating: 1170
    }

  ];


  leaderboard.innerHTML = "";


  players.forEach(item => {

    leaderboard.innerHTML += `

      <div class="leaderboard-row">

        <div class="rank">
          ${item.rank}
        </div>

        <div class="player-info">

          <strong>
            ${item.name}
          </strong>

          <small>
            ${item.username}
          </small>

        </div>

        <div class="player-score">

          ${item.wins} wins

          <small>
            ${item.rating} rating
          </small>

        </div>

      </div>

    `;

  });

}


// ==========================================
// PROFILE
// ==========================================

function updateProfile() {

  const profile =
    document.getElementById(
      "profileScreen"
    );


  if (!profile) {

    return;

  }


  const stats =
    profile.querySelectorAll(
      ".stat strong"
    );


  if (stats.length >= 4) {

    stats[0].innerText =
      player.wins;

    stats[1].innerText =
      player.losses;

    stats[2].innerText =
      player.winStreak;

    stats[3].innerText =
      player.rating;

  }

}


// ==========================================
// LOCAL PLAYER STORAGE
// ==========================================

function saveLocalPlayer() {

  try {

    localStorage.setItem(

      "swiftfinger_player",

      JSON.stringify(player)

    );

  } catch (error) {

    console.log(
      "Local storage unavailable."
    );

  }

}


function loadLocalPlayer() {

  try {

    const saved =
      localStorage.getItem(
        "swiftfinger_player"
      );


    if (!saved) {

      return;

    }


    const data =
      JSON.parse(saved);


    Object.assign(
      player,
      data
    );


  } catch (error) {

    console.log(
      "Unable to load player."
    );

  }

}


// ==========================================
// ANNOUNCEMENT POPUP
// ==========================================

function openAnnouncement() {

  const popup =
    document.getElementById(
      "announcementPopup"
    );


  if (!popup) {

    return;

  }


  popup.classList.remove(
    "hidden"
  );

}


function closeAnnouncement() {

  const popup =
    document.getElementById(
      "announcementPopup"
    );


  if (!popup) {

    return;

  }


  popup.classList.add(
    "hidden"
  );


  rememberAnnouncement();

}


// ==========================================
// ANNOUNCEMENT FREQUENCY
// ==========================================

function rememberAnnouncement() {

  try {

    localStorage.setItem(

      "swiftfinger_announcement_seen",

      Date.now().toString()

    );

  } catch (error) {

    console.log(
      "Unable to save announcement state."
    );

  }

}


function shouldShowAnnouncement() {

  if (
    !SwiftFingerConfig
      .announcementEnabled
  ) {

    return false;

  }


  try {

    const lastSeen =
      Number(
        localStorage.getItem(
          "swiftfinger_announcement_seen"
        )
      );


    if (!lastSeen) {

      return true;

    }


    const day =
      24 * 60 * 60 * 1000;


    if (
      SwiftFingerConfig
        .announcementFrequency ===
      "once_per_day"
    ) {

      return (
        Date.now() - lastSeen >=
        day
      );

    }


  } catch (error) {

    return true;

  }


  return true;

}


// ==========================================
// RULES
// ==========================================

function showRules() {

  showToast(

    "5 attempts • No draws • Unlimited rematches"

  );

}


// ==========================================
// TOAST
// ==========================================

function showToast(message) {

  const toast =
    document.getElementById(
      "toast"
    );


  if (!toast) {

    return;

  }


  toast.innerText =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    window.swiftFingerToast
  );


  window.swiftFingerToast =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 2500);

}


// ==========================================
// TELEGRAM USER
// ==========================================

function loadTelegramUser() {

  if (
    !tg ||
    !tg.initDataUnsafe ||
    !tg.initDataUnsafe.user
  ) {

    return;

  }


  const telegramUser =
    tg.initDataUnsafe.user;


  player.id =
    telegramUser.id;


  player.username =
    telegramUser.username
      ? "@" + telegramUser.username
      : (
        telegramUser.first_name ||
        "Player"
      );


  updateTelegramProfileName();

}


function updateTelegramProfileName() {

  const profile =
    document.getElementById(
      "profileScreen"
    );


  if (!profile) {

    return;

  }


  const heading =
    profile.querySelector(
      ".profile-card h2"
    );


  const username =
    profile.querySelector(
      ".profile-card .username"
    );


  if (heading) {

    heading.innerText =
      player.username;

  }


  if (username) {

    username.innerText =
      player.username;

  }

}


// ==========================================
// TELEGRAM BACK BUTTON
// ==========================================

function setupTelegramBackButton() {

  if (!tg) {

    return;

  }


  if (
    tg.BackButton
  ) {

    tg.BackButton.onClick(
      goHome
    );

  }

}


// ==========================================
// INITIALIZATION
// ==========================================

function initializeSwiftFinger() {

  loadLocalPlayer();

  loadTelegramUser();

  setupTelegramBackButton();

  updateProfile();


  if (
    shouldShowAnnouncement()
  ) {

    setTimeout(
      openAnnouncement,
      500
    );

  }

}


// Start the application.

document.addEventListener(
  "DOMContentLoaded",
  initializeSwiftFinger
);
