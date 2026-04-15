const btn = document.getElementById("theme-toggle");

if (btn) {
  btn.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
    btn.textContent = document.body.classList.contains("dark-mode") ? "Light Mode" : "Dark Mode";
  });
}