// 捲動淡入動畫
window.addEventListener("scroll", () => {
    const elements = document.querySelectorAll(".fade-in");
    const triggerBottom = window.innerHeight * 0.85;

    elements.forEach(el => {
        const boxTop = el.getBoundingClientRect().top;
        if (boxTop < triggerBottom) {
            el.classList.add("show");
        }
    });
});
