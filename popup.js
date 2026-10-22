const src = document.getElementById("src");
const dst = document.getElementById("dst");
const statusEl = document.getElementById("status");

let remoteTabs = [];
let localTabs = [];
let currentTabId = null; // id of the active tab, only set if it is a localhost tab

function status(msg, ok = true) {
  statusEl.textContent = msg;
  statusEl.className = ok ? "ok" : "err";
}

// Functions below run inside the web pages
const readToken = () => localStorage.getItem("token");
const writeToken = (t) => localStorage.setItem("token", t);

const appOf = (url) => new URL(url).pathname.split("/")[1]; // e.g. repair-center-app

function fill(select, tabs, label) {
  select.innerHTML = "";
  tabs.forEach((t) => {
    const o = document.createElement("option");
    o.value = t.id;
    o.textContent = label(t);
    if (t.id === currentTabId && select === dst) o.className = "current";
    select.appendChild(o);
  });
}

// Show the green style when "Current tab" is the selected item
function updateDstStyle() {
  dst.classList.toggle("current", +dst.value === currentTabId);
}

// If the active tab is not localhost, pre-select the localhost tab of the same app
function autoMatch() {
  if (currentTabId !== null) return;
  const srcTab = remoteTabs.find((t) => t.id === +src.value);
  if (!srcTab) return;
  const app = appOf(srcTab.url);
  const match = localTabs.find((t) => appOf(t.url) === app);
  if (match) dst.value = match.id;
  updateDstStyle();
}

async function getToken() {
  if (!src.value) { status("Open a dev/sys/uat tab first", false); return null; }
  let result;
  try {
    [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: +src.value },
      func: readToken,
    });
  } catch (e) {
    status("Cannot read that tab: " + e.message, false);
    return null;
  }
  if (!result) { status("No 'token' key in that tab's localStorage", false); return null; }
  return result;
}

(async () => {
  remoteTabs = await chrome.tabs.query({ url: "*://*.example.com/*" });
  localTabs = await chrome.tabs.query({ url: "*://localhost/*" });

  // Is the tab the user is looking at a localhost tab?
  const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (active && localTabs.some((t) => t.id === active.id)) {
    currentTabId = active.id;
    // Put the current tab first in the list
    localTabs.sort((a, b) => (b.id === currentTabId) - (a.id === currentTabId));
  }

  fill(src, remoteTabs, (t) => {
    const u = new URL(t.url);
    return `${u.host}${u.pathname}`;
  });
  fill(dst, localTabs, (t) => {
    if (t.id === currentTabId) return "Current tab";
    const u = new URL(t.url);
    return `${u.host}${u.pathname}`;
  });

  if (currentTabId !== null) dst.value = currentTabId;
  autoMatch();
  updateDstStyle();
  src.onchange = autoMatch;
  dst.onchange = updateDstStyle;

  if (!remoteTabs.length) status("Open a dev/sys/uat tab first", false);
  else if (!localTabs.length) status("Open a localhost tab to paste into", false);
})();

document.getElementById("clip").onclick = async () => {
  const token = await getToken();
  if (!token) return;
  await navigator.clipboard.writeText(token);
  status("Token copied to clipboard");
};

document.getElementById("go").onclick = async () => {
  if (!dst.value) return status("Open a localhost tab first", false);
  const token = await getToken();
  if (!token) return;

  await navigator.clipboard.writeText(token); // always keep a copy on the clipboard

  await chrome.scripting.executeScript({
    target: { tabId: +dst.value },
    func: writeToken,
    args: [token],
  });

  // Reload on the real UI path (a tab stuck on /oauth-login would stay on login)
  const tab = await chrome.tabs.get(+dst.value);
  const u = new URL(tab.url);
  await chrome.tabs.update(tab.id, { url: `${u.origin}/${appOf(tab.url)}/ui/` });

  status("Token set in localhost tab and copied to clipboard");
};
