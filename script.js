// Current year in the footer
const year = document.getElementById("year");

year.textContent = `© ${new Date().getFullYear()} Fort`;


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