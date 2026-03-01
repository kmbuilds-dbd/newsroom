const API_BASE = "http://localhost:3000";

const queryInput = document.getElementById("query");
const submitBtn = document.getElementById("submit");
const statusEl = document.getElementById("status");

// Pre-fill with the active tab's title
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (tab?.title) {
    queryInput.value = tab.title;
    queryInput.select();
  }
});

submitBtn.addEventListener("click", async () => {
  const query = queryInput.value.trim();
  if (!query) return;

  submitBtn.disabled = true;
  showStatus("Generating timeline...", "loading");

  try {
    const res = await fetch(`${API_BASE}/api/stories/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_query: query }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    const { story_id } = await res.json();
    chrome.tabs.create({ url: `${API_BASE}/story/${story_id}` });
    window.close();
  } catch (err) {
    showStatus(err.message || "Generation failed", "error");
    submitBtn.disabled = false;
  }
});

queryInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitBtn.click();
});

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}
