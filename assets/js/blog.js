(function () {
  "use strict";

  const filters = Array.from(document.querySelectorAll("[data-blog-filter]"));
  const cards = Array.from(document.querySelectorAll("[data-blog-category]"));
  const empty = document.querySelector("[data-blog-empty]");

  if (!filters.length || !cards.length) return;

  function setFilter(category) {
    let visible = 0;

    filters.forEach((button) => {
      const active = button.dataset.blogFilter === category;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    cards.forEach((card) => {
      const categories = (card.dataset.blogCategory || "").split(" ");
      const show = category === "todos" || categories.includes(category);
      card.hidden = !show;
      if (show) visible += 1;
    });

    if (empty) empty.classList.toggle("is-visible", visible === 0);
  }

  filters.forEach((button) => {
    button.addEventListener("click", () => setFilter(button.dataset.blogFilter));
  });
})();
