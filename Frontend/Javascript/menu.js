const toggleButton = document.getElementById("toggleMenu");
const menu = document.getElementById("menu");

toggleButton.addEventListener("click", () => {
    menu.classList.toggle("open");
});