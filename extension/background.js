const API_BASE = "http://localhost:3000";
const API_KEY = "7a111c34cd9f7222d9470c8fa0eb0f8cbc239d0317d8104b4245e98f0145e8b7";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "generate-timeline",
    title: "Generate Timeline with Newsroom",
    contexts: ["page"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "generate-timeline") return;

  const title = tab?.title;
  if (!title) {
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
    return;
  }

  try {
    chrome.action.setBadgeText({ text: "..." });
    chrome.action.setBadgeBackgroundColor({ color: "#6366f1" });

    const res = await fetch(`${API_BASE}/api/stories/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify({ event_query: title }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    const { story_id } = await res.json();
    chrome.action.setBadgeText({ text: "" });
    chrome.tabs.create({ url: `${API_BASE}/story/${story_id}` });
  } catch (err) {
    console.error("Newsroom generation failed:", err);
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
    setTimeout(() => chrome.action.setBadgeText({ text: "" }), 5000);
  }
});
