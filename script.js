// Current year in the footer
const year = document.getElementById("year");

year.textContent = `© ${new Date().getFullYear()} Fort`;


// Small "hello" effect when the page loads
window.addEventListener("load", () => {
    document.body.classList.add("loaded");
});