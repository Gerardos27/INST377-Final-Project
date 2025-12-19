let chartInstance = null;
let swiperInstance = null;

async function fetchHighlights(competitionText) {
  const q = competitionText ? "?competition=" + encodeURIComponent(competitionText) : "";
  const res = await fetch("/api/highlights" + q);
  if (!res.ok) throw new Error("Highlights fetch failed");
  const data = await res.json();
  return (data.response || []).slice(0, 10);
}

async function fetchFavorites() {
  const res = await fetch("/api/favorites");
  if (!res.ok) throw new Error("Favorites fetch failed");
  const data = await res.json();
  return data.favorites || [];
}

async function postFavorite(payload) {
  const res = await fetch("/api/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Favorite save failed");
  return data.favorite;
}

function renderFavorites(list) {
  const ul = document.getElementById("favoritesList");
  if (!ul) return;

  ul.innerHTML = "";

  if (list.length === 0) {
    ul.innerHTML = "<li>No favorites yet</li>";
    return;
  }

  list.forEach((f) => {
    const li = document.createElement("li");
    const comp = f.competition ? " | " + f.competition : "";
    li.textContent = f.title + comp;
    ul.appendChild(li);
  });
}

function buildCounts(matches) {
  const counts = {};
  matches.forEach((m) => {
    const key = m.competition || "Unknown";
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

function renderChart(matches) {
  const canvas = document.getElementById("compChart");
  if (!canvas) return;

  const counts = buildCounts(matches);
  const labels = Object.keys(counts);
  const values = Object.values(counts);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Highlights per competition", data: values }]
    }
  });
}

function renderSwiper(matches) {
  const wrap = document.getElementById("swiperWrapper");
  if (!wrap) return;

  wrap.innerHTML = "";

  matches.forEach((m) => {
    const slide = document.createElement("div");
    slide.className = "swiper-slide";

    const embed =
      (m.videos && m.videos[0] && m.videos[0].embed) ? m.videos[0].embed : "";

    slide.innerHTML = `
      <div class="card slide-card">
        <h3>${m.title || "Match"}</h3>
        <div class="slide-meta">${m.competition || "Unknown competition"}</div>
        <div class="video">${embed}</div>
        <button class="btn save-btn">Save favorite</button>
      </div>
    `;

    const btn = slide.querySelector(".save-btn");
    btn.addEventListener("click", async () => {
      try {
        await postFavorite({
          title: m.title || "Match",
          competition: m.competition || "",
          match_url: m.matchviewUrl || ""
        });

        const favs = await fetchFavorites();
        renderFavorites(favs);
      } catch (err) {
        alert(String(err.message || err));
      }
    });

    wrap.appendChild(slide);
  });

  if (swiperInstance) {
    swiperInstance.destroy(true, true);
  }

  swiperInstance = new Swiper(".swiper", {
    slidesPerView: 1,
    spaceBetween: 14,
    pagination: {
      el: ".swiper-pagination",
      clickable: true
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev"
    }
  });
}

async function loadAll() {
  const input = document.getElementById("competitionInput");
  const comp = input ? input.value.trim() : "";

  const matches = await fetchHighlights(comp);
  renderSwiper(matches);
  renderChart(matches);

  const favs = await fetchFavorites();
  renderFavorites(favs);
}

function wireUI() {
  const btn = document.getElementById("loadBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Loading";
    try {
      await loadAll();
    } catch (err) {
      alert(String(err.message || err));
    } finally {
      btn.disabled = false;
      btn.textContent = "Load";
    }
  });
}

wireUI();
loadAll().catch(() => {});