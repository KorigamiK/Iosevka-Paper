const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Theme toggle (matches korigamik.dev behaviour) ───────────────────

const THEME_KEY = "theme";
const systemTheme = matchMedia("(prefers-color-scheme: dark)");

function storedTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "dark" || t === "light" ? t : null;
  } catch {
    return null;
  }
}

function currentTheme() {
  return storedTheme() ?? (systemTheme.matches ? "dark" : "light");
}

function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(theme === "dark"));
  });
}

document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    applyTheme(next);
  });
});

systemTheme.addEventListener("change", () => {
  if (storedTheme() === null) applyTheme(currentTheme());
});

applyTheme(currentTheme());

// ── Width switcher ────────────────────────────────────────────────────

const WIDTH_KEY = "iosevka-paper-width";
const widthOpts = document.querySelectorAll("#width-switcher .seg-opt");

function applyWidth(width) {
  document.documentElement.classList.toggle("ext", width === "ext");
  widthOpts.forEach((b) => b.classList.toggle("active", b.dataset.width === width));
}

widthOpts.forEach((btn) => {
  btn.addEventListener("click", () => {
    try { localStorage.setItem(WIDTH_KEY, btn.dataset.width); } catch {}
    applyWidth(btn.dataset.width);
  });
});

try {
  const saved = localStorage.getItem(WIDTH_KEY);
  if (saved) applyWidth(saved);
} catch {}

// ── Terminal tabs ─────────────────────────────────────────────────────

document.querySelectorAll("[data-term-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    const wrap = tab.closest(".terminal");
    wrap.querySelectorAll("[data-term-tab]").forEach((t) => t.classList.remove("active"));
    wrap.querySelectorAll("[data-term-panel]").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    wrap.querySelector(`[data-term-panel="${tab.dataset.termTab}"]`)?.classList.add("active");
  });
});

// ── Try It editor ─────────────────────────────────────────────────────

const tryInput = document.getElementById("try-input");
const tryHighlight = document.getElementById("try-highlight");
const tryGutter = document.getElementById("try-gutter");
const tryLangBtns = document.querySelectorAll("[data-try-lang]");
const trySamples = document.getElementById("try-samples");
const tryStatusLang = document.getElementById("try-status-lang");
let tryLang = "js";

const langNames = { js: "JavaScript", py: "Python", rust: "Rust", cpp: "C++", haskell: "Haskell" };

const samples = {
  js: [
    {
      label: "Fold",
      code: [
        'const fold = (paper) => {',
        '    if (paper.creases >= 23) return "crane";',
        '    return fold({ ...paper, creases: paper.creases + 1 });',
        '};',
        '',
        'const sheet = { creases: 0, color: "#fffff0" };',
        'console.log(`A sheet becomes a ${fold(sheet)}.`);',
      ].join("\n"),
    },
    {
      label: "Async",
      code: [
        'async function latestRelease(repo) {',
        '    const url = `https://api.github.com/repos/${repo}/releases/latest`;',
        '    const res = await fetch(url);',
        '    if (!res.ok) throw new Error(`HTTP ${res.status}`);',
        '    const { tag_name, assets } = await res.json();',
        '    return { tag: tag_name, files: assets.map(a => a.name) };',
        '}',
      ].join("\n"),
    },
  ],
  py: [
    {
      label: "Dataclass",
      code: [
        'from dataclasses import dataclass',
        '',
        '@dataclass(frozen=True)',
        'class Glyph:',
        '    char: str',
        '    variant: str',
        '',
        'opinions = [',
        '    Glyph("0", "tall-slashed"),',
        '    Glyph("1", "no-base"),',
        '    Glyph("8", "two-circles"),',
        ']',
        'for g in opinions:',
        '    print(f"{g.char} -> {g.variant}")',
      ].join("\n"),
    },
    {
      label: "Generator",
      code: [
        'def line_widths(text, columns=80):',
        '    """Condensed glyphs fit more per line."""',
        '    words, line = text.split(), ""',
        '    for word in words:',
        '        if len(line) + len(word) >= columns:',
        '            yield line.rstrip()',
        '            line = ""',
        '        line += word + " "',
        '    yield line.rstrip()',
      ].join("\n"),
    },
  ],
  rust: [
    {
      label: "Match",
      code: [
        '#[derive(Debug)]',
        'enum Width {',
        '    Normal,      // 416 units, the default',
        '    Extended,    // 500 units',
        '}',
        '',
        'fn columns(w: &Width, px: u32) -> u32 {',
        '    match w {',
        '        Width::Normal => px / 8,',
        '        Width::Extended => px / 10,',
        '    }',
        '}',
      ].join("\n"),
    },
    {
      label: "Iterator",
      code: [
        'let weights = [400, 500, 700];',
        '',
        'let styles: Vec<String> = weights',
        '    .iter()',
        '    .flat_map(|w| ["upright", "italic"].map(|s| format!("{w} {s}")))',
        '    .collect();',
        '',
        'assert_eq!(styles.len(), 6);',
      ].join("\n"),
    },
  ],
  cpp: [
    {
      label: "Concepts",
      code: [
        'template <typename T>',
        'concept Legible = requires(T glyph) {',
        '    { glyph.distinct() } -> std::convertible_to<bool>;',
        '};',
        '',
        'template <Legible T>',
        'auto render(const T& g) -> bool {',
        '    return g.distinct();  // 0 != O, 1 != l != I',
        '}',
      ].join("\n"),
    },
  ],
  haskell: [
    {
      label: "Types",
      code: [
        'data Slope = Upright | Italic Double',
        '    deriving (Show, Eq)',
        '',
        'angle :: Slope -> Double',
        'angle Upright    = 0.0',
        'angle (Italic a) = a',
        '',
        'main :: IO ()',
        'main = print (angle (Italic 9.4))',
      ].join("\n"),
    },
  ],
};

function renderSamples() {
  trySamples.innerHTML = (samples[tryLang] || [])
    .map((s, i) => `<button class="chip" data-sample="${i}">${s.label}</button>`)
    .join("");
}

function loadSample(i) {
  const s = samples[tryLang]?.[i];
  if (!s) return;
  tryInput.textContent = s.code;
  updateEditor();
}

function updateEditor() {
  const text = tryInput.innerText;
  tryGutter.textContent = text.split("\n").map((_, i) => i + 1).join("\n");
  tryHighlight.textContent = text || " ";
  tryHighlight.className = `language-${tryLang}`;
  window.Prism.plugins.autoloader.loadLanguages([tryLang], () => {
    window.Prism.highlightElement(tryHighlight);
  });
}

tryInput.addEventListener("scroll", () => {
  tryHighlight.scrollTop = tryInput.scrollTop;
  tryHighlight.scrollLeft = tryInput.scrollLeft;
  tryGutter.scrollTop = tryInput.scrollTop;
});

tryInput.addEventListener("input", updateEditor);

tryInput.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    document.execCommand("insertText", false, "    ");
    updateEditor();
  }
});

tryInput.addEventListener("paste", (e) => {
  e.preventDefault();
  document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
  updateEditor();
});

tryLangBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    tryLangBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    tryLang = btn.dataset.tryLang;
    tryStatusLang.textContent = langNames[tryLang] || tryLang;
    renderSamples();
    loadSample(0);
  });
});

trySamples.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-sample]");
  if (btn) loadSample(parseInt(btn.dataset.sample));
});

renderSamples();
tryInput.textContent = samples.js[0].code;
window.Prism.plugins.autoloader.loadLanguages(
  ["javascript", "python", "rust", "cpp", "haskell"],
  updateEditor,
);

// ── Release info: version tag, download counts, direct links ─────────
// release.json is baked at deploy time; the GitHub API refreshes it live.

const REPO = "KorigamiK/Iosevka-Paper";

function applyRelease(release) {
  if (!release?.assets?.length) return;

  const tagEl = document.getElementById("release-tag");
  if (tagEl && release.tag_name) tagEl.textContent = release.tag_name;

  const rows = Array.from(document.querySelectorAll("tr[data-asset]"));
  const matched = rows.map((row) => {
    const re = new RegExp(row.dataset.asset);
    return { row, asset: release.assets.find((a) => re.test(a.name)) };
  });

  const max = Math.max(...matched.map((m) => m.asset?.download_count ?? 0));
  matched.forEach(({ row, asset }) => {
    if (!asset) return;
    if (asset.browser_download_url) {
      row.querySelector(".dl-link").href = asset.browser_download_url;
    }
    if (typeof asset.download_count === "number" && max > 0) {
      row.querySelector(".dl-num").textContent = asset.download_count.toLocaleString();
      row.querySelector(".dl-fill").style.width = `${(asset.download_count / max) * 100}%`;
    }
  });
}

(async () => {
  try {
    const baked = await fetch(`${BASE}/release.json`);
    if (baked.ok) applyRelease(await baked.json());
  } catch {}
  try {
    const live = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`);
    if (live.ok) applyRelease(await live.json());
  } catch {}
})();
