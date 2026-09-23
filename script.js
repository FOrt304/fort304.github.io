// Current year in the footer
const year = document.getElementById("year");

year.textContent = `© ${new Date().getFullYear()} • Made with 💙 by FOrt404. • All rights reserved.`;

const musicToggle = document.getElementById("music-toggle");
const musicControl = document.getElementById("music-control");
const musicVolume = document.getElementById("music-volume");
const musicTrack = document.getElementById("music-track");
const musicTrackName = document.getElementById("music-track-name");
const backgroundMusic = new Audio();
const musicManifestPath = "music/playlist.json";
backgroundMusic.volume = Number(musicVolume.value);
let lastMusicVolume = backgroundMusic.volume;
const minimumUnmutedVolume = 0.15;
let musicQueue = [];
let musicQueueIndex = 0;
let musicStarted = false;
let musicMuted = false;

function shuffleMusicQueue(tracks) {
    const shuffledTracks = [...tracks];

    for (let index = shuffledTracks.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffledTracks[index], shuffledTracks[randomIndex]] = [
            shuffledTracks[randomIndex],
            shuffledTracks[index]
        ];
    }

    return shuffledTracks;
}

function updateMusicToggle() {
    musicToggle.setAttribute("aria-label", musicMuted ? "Turn background music on" : "Mute background music");
    musicToggle.setAttribute("aria-pressed", String(musicMuted));
    musicControl.classList.toggle("is-muted", musicMuted);
    musicVolume.value = String(backgroundMusic.volume);
    musicVolume.style.setProperty("--volume-level", `${backgroundMusic.volume * 100}%`);
}

function playNextTrack() {
    if (!musicQueue.length) {
        return;
    }

    if (musicQueueIndex >= musicQueue.length) {
        musicQueue = shuffleMusicQueue(musicQueue);
        musicQueueIndex = 0;
    }

    const nextTrack = musicQueue[musicQueueIndex];
    const trackName = decodeURIComponent(nextTrack.split("/").pop())
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]+/g, " ");

    backgroundMusic.src = nextTrack;
    musicQueueIndex += 1;
    musicTrackName.textContent = trackName;
    musicTrack.hidden = false;
    backgroundMusic.play().then(() => {
        musicStarted = true;
        window.removeEventListener("pointerdown", startMusicAfterInteraction);
        updateMusicToggle();
    }).catch(() => {
    });
}

async function setupBackgroundMusic() {
    try {
        const response = await fetch(musicManifestPath);
        const tracks = await response.json();

        if (!Array.isArray(tracks) || !tracks.length) {
            return;
        }

        musicQueue = shuffleMusicQueue(tracks.map((track) => {
            const normalizedTrack = track.replace(/^\/+/, "");
            return normalizedTrack.startsWith("music/") ?
                normalizedTrack : `music/${normalizedTrack}`;
        }));
        musicControl.hidden = false;
        backgroundMusic.addEventListener("ended", playNextTrack);
        playNextTrack();
    } catch (error) {
        console.warn("Background music unavailable:", error);
    }
}

musicToggle.addEventListener("click", () => {
    musicMuted = !musicMuted;

    if (!musicMuted) {
        backgroundMusic.volume = Math.max(lastMusicVolume, minimumUnmutedVolume);
        backgroundMusic.muted = false;
    } else {
        lastMusicVolume = backgroundMusic.volume;
        backgroundMusic.volume = 0;
        backgroundMusic.muted = true;
    }

    if (!musicStarted) {
        playNextTrack();
    }

    updateMusicToggle();
});

musicVolume.addEventListener("input", () => {
    backgroundMusic.volume = Number(musicVolume.value);
    musicVolume.style.setProperty("--volume-level", `${backgroundMusic.volume * 100}%`);

    if (backgroundMusic.volume > 0) {
        lastMusicVolume = backgroundMusic.volume;
        musicMuted = false;
        backgroundMusic.muted = false;
    } else {
        musicMuted = true;
        backgroundMusic.muted = true;
    }

    updateMusicToggle();
});

function startMusicAfterInteraction() {
    if (!musicStarted && musicQueue.length) {
        playNextTrack();
    }
}

window.addEventListener("pointerdown", startMusicAfterInteraction);

setupBackgroundMusic();

// Configure your Discord user ID here to enable the live presence widget.
const DISCORD_USER_ID = "541605282942418964";
const statusText = document.getElementById("status-text");
const statusDot = document.getElementById("status-dot");
const statusLink = document.getElementById("status-link");

const fallbackStatus = "probably playing :3";
const secondaryFallbackStatus = "online :3";

function setStatusVisual(discordStatus) {
    const normalizedStatus = discordStatus || "online";

    statusDot.classList.remove("online", "idle", "dnd", "offline");
    statusDot.classList.add(normalizedStatus);
}

function getPresenceText(data) {
    if (!data || !data.activities) {
        return fallbackStatus;
    }

    const activities = [...data.activities].sort((a, b) => Number(b.timestamps?.start) - Number(a.timestamps?.start));
    const activeActivity = activities.find((activity) => activity.type !== 4) || activities[0];

    if (!activeActivity) {
        return data.discord_status === "online" ? "Online" :
            data.discord_status === "idle" ? "Idle" :
            data.discord_status === "dnd" ? "Do not disturb" :
            fallbackStatus;
    }

    if (activeActivity.type === 2 && activeActivity.state) {
        return `Listening to ${activeActivity.details || "music"}`;
    }

    if (activeActivity.type === 0 && activeActivity.name) {
        return `Playing ${activeActivity.name}`;
    }

    if (activeActivity.type === 1 && activeActivity.name) {
        return `Streaming ${activeActivity.name}`;
    }

    if (activeActivity.type === 3 && activeActivity.name) {
        return `Watching ${activeActivity.name}`;
    }

    if (activeActivity.state) {
        return activeActivity.state;
    }

    return activeActivity.name || fallbackStatus;
}

async function updateDiscordStatus() {
    if (!DISCORD_USER_ID || DISCORD_USER_ID === "YOUR_DISCORD_USER_ID") {
        statusText.textContent = fallbackStatus;
        setStatusVisual("online");
        statusLink.href = "https://discord.com/";
        return;
    }

    try {
        const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`);

        if (!response.ok) {
            throw new Error(`Status request failed: ${response.status}`);
        }

        const payload = await response.json();
        const data = payload?.data;

        if (!data) {
            throw new Error("No status data returned");
        }

        const presenceText = getPresenceText(data);
        statusText.textContent = presenceText;
        setStatusVisual(data.discord_status || "offline");
        statusLink.href = `https://discord.com/users/${DISCORD_USER_ID}`;
    } catch (error) {
        console.warn("Discord status unavailable:", error);

        const isUserMissing = String(error).includes("404") || String(error).includes("No status data returned");
        statusText.textContent = isUserMissing ? secondaryFallbackStatus : fallbackStatus;
        setStatusVisual("online");
        statusLink.href = `https://discord.com/users/${DISCORD_USER_ID}`;
    }
}

updateDiscordStatus();
setInterval(updateDiscordStatus, 30000);


// Add or remove image paths here to change the random backgrounds.
const backgroundImages = [
    "/images/cat1.jpg",
    "/images/cat2.png",
    "/images/catdrool.png",
    "/images/avataranime.png"
];

const background = document.querySelector(".background");
const previousBackgroundKey = "fort-previous-background";

const previousBackground = localStorage.getItem(previousBackgroundKey);
const availableBackgrounds = backgroundImages.filter(
    (image) => image !== previousBackground
);
const randomBackground = availableBackgrounds[
    Math.floor(Math.random() * availableBackgrounds.length)
] || backgroundImages[0];

background.style.backgroundImage = `linear-gradient(rgba(5, 11, 28, 0.28), rgba(5, 11, 28, 0.5)), url("${randomBackground}")`;
localStorage.setItem(previousBackgroundKey, randomBackground);


// Small "hello" effect when the page loads
window.addEventListener("load", () => {
    document.body.classList.add("loaded");
});


// Add a light snowfall and a quiet field of stars across the whole viewport.
const starLayer = document.querySelector(".star-layer");
const snowLayer = document.querySelector(".snow-layer");

function createSkyEffects() {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const starCount = prefersReducedMotion ? 30 : 70;
    const snowflakeCount = prefersReducedMotion ? 0 : 34;

    for (let index = 0; index < starCount; index += 1) {
        const star = document.createElement("span");
        star.className = "star";
        star.style.setProperty("--star-x", `${Math.random() * 100}%`);
        star.style.setProperty("--star-y", `${Math.random() * 100}%`);
        star.style.setProperty("--star-size", `${1 + Math.random() * 2.5}px`);
        const starOpacity = 0.35 + Math.random() * 0.6;
        star.style.setProperty("--star-opacity", `${starOpacity}`);
        star.style.setProperty("--star-dim-opacity", `${starOpacity * 0.45}`);
        star.style.setProperty("--star-duration", `${2.5 + Math.random() * 4}s`);
        star.style.animationDelay = `${Math.random() * -4}s`;
        starLayer.appendChild(star);
    }

    for (let index = 0; index < snowflakeCount; index += 1) {
        const snowflake = document.createElement("span");
        snowflake.className = "snowflake";
        snowflake.textContent = Math.random() > 0.45 ? "❄" : "✦";
        snowflake.style.setProperty("--snow-x", `${Math.random() * 100}%`);
        snowflake.style.setProperty("--snow-size", `${10 + Math.random() * 14}px`);
        snowflake.style.setProperty("--snow-opacity", `${0.3 + Math.random() * 0.5}`);
        snowflake.style.setProperty("--snow-duration", `${12 + Math.random() * 16}s`);
        snowflake.style.setProperty("--snow-delay", `${Math.random() * -24}s`);
        snowflake.style.setProperty("--snow-drift", `${-80 + Math.random() * 160}px`);
        snowLayer.appendChild(snowflake);
    }
}

createSkyEffects();


// Make tags and links tilt toward the cursor.
document.querySelectorAll(".tags span, .links a, .status, .profile-flags a, .footer-contact").forEach((element) => {
    element.addEventListener("pointermove", (event) => {
        const bounds = element.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;

        element.style.setProperty("--tag-rotate-y", `${x * 10}deg`);
        element.style.setProperty("--tag-rotate-x", `${y * -10}deg`);
        element.style.setProperty("--link-rotate-y", `${x * 4}deg`);
        element.style.setProperty("--link-rotate-x", `${y * -4}deg`);
        element.style.setProperty("--tag-lift", "-3px");
        element.style.setProperty("--link-lift", "-3px");
    });

    element.addEventListener("pointerleave", () => {
        element.style.setProperty("--tag-rotate-x", "0deg");
        element.style.setProperty("--tag-rotate-y", "0deg");
        element.style.setProperty("--link-rotate-x", "0deg");
        element.style.setProperty("--link-rotate-y", "0deg");
        element.style.setProperty("--tag-lift", "0px");
        element.style.setProperty("--link-lift", "0px");
    });
});


// Run name particles continuously and make avatar particles more frequent on hover.
document.querySelectorAll(".avatar-target, .name-target, .flag-target").forEach((target) => {
    const particleLayer = target.querySelector(".particle-layer");
    const isAvatar = target.classList.contains("avatar-target");
    const particlePalettes = target.classList.contains("flag-sweden-target") ?
        ["#f6d34a", "#2363a5"] :
        target.classList.contains("flag-pan-target") ?
            ["#f5a9b8", "#f5e65c", "#58c7e8"] :
            ["#79c8ff"];
    let particleTimer;

    function createParticle() {
        const particle = document.createElement("span");
        const particleType = Math.random();
        const particleColor = particlePalettes[
            Math.floor(Math.random() * particlePalettes.length)
        ];

        particle.className = "particle";
        particle.textContent = particleType < 0.3 ? ":3" :
            particleType < 0.6 ? "♡" : "✦";
        particle.style.setProperty("--particle-color", particleColor);
        particle.style.setProperty("--particle-shadow", `${particleColor}d9`);
        particle.style.setProperty("--particle-x", `${15 + Math.random() * 70}%`);
        particle.style.setProperty("--particle-y", `${15 + Math.random() * 70}%`);
        particle.style.setProperty("--particle-size", `${particleType < 0.3 ? 11 : 10 + Math.random() * 8}px`);
        particle.style.setProperty("--particle-drift-x", `${-18 + Math.random() * 36}px`);
        particle.style.setProperty("--particle-drift-y", `${-28 - Math.random() * 20}px`);
        particle.style.setProperty("--particle-rotation", `${-25 + Math.random() * 50}deg`);

        particleLayer.appendChild(particle);
        particle.addEventListener("animationend", () => particle.remove(), { once: true });
    }

    function scheduleParticle() {
        particleTimer = window.setTimeout(() => {
            createParticle();
            scheduleParticle();
        }, isAvatar ? 220 + Math.random() * 280 : 900 + Math.random() * 1400);
    }

    target.addEventListener("pointermove", (event) => {
        const bounds = target.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;

        target.style.setProperty("--avatar-rotate-y", `${x * 8}deg`);
        target.style.setProperty("--avatar-rotate-x", `${y * -8}deg`);
        target.style.setProperty("--name-rotate-y", `${x * 5}deg`);
        target.style.setProperty("--name-rotate-x", `${y * -5}deg`);
    });

    if (isAvatar || target.classList.contains("flag-target")) {
        target.addEventListener("pointerenter", () => {
            createParticle();
            scheduleParticle();
        });

        target.addEventListener("pointerleave", () => {
            window.clearTimeout(particleTimer);
            target.style.setProperty("--avatar-rotate-x", "0deg");
            target.style.setProperty("--avatar-rotate-y", "0deg");
            target.style.setProperty("--name-rotate-x", "0deg");
            target.style.setProperty("--name-rotate-y", "0deg");
        });
    } else {
        scheduleParticle();
    }
});