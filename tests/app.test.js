const test = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");

const { createApp } = require("../app.js");
const ModelUtils = require("../model-utils.js");

const ENRICHMENTS = {
  providers: {
    openai: { label: "OpenAI", logo: "OPENAI" },
    meta: { label: "Meta", logo: "META" }
  },
  useCasesByCategory: {
    Writing: ["Write copy", "Draft email"],
    Coding: ["Debug code", "Generate tests"],
    Learning: ["Explain concept", "Summarize notes"],
    Business: ["Analyze feedback", "Draft proposal"],
    Creative: ["Generate concepts", "Story ideas"]
  }
};

function createDom() {
  return new JSDOM(
    `<!doctype html>
      <html>
        <body>
          <div id="particles"></div>
          <select id="useCaseFilter">
            <option value="All" selected>All</option>
            <option value="Writing">Writing</option>
            <option value="Coding">Coding</option>
            <option value="Learning">Learning</option>
            <option value="Business">Business</option>
            <option value="Creative">Creative</option>
          </select>
          <div id="statusMessage"></div>
          <div id="freeModelCount">0</div>
          <div id="modelsGrid"></div>
        </body>
      </html>`,
    { pretendToBeVisual: true }
  );
}

function createImmediateRaf() {
  return (callback) => {
    callback(Date.now() + 1000);
    return 1;
  };
}

test("init renders only free models and sorts by context length", async () => {
  const dom = createDom();
  const models = [
    {
      id: "vendor/assistant-lite",
      name: "Assistant Lite",
      context_length: 16000,
      pricing: { prompt: "0.000000", completion: "0" }
    },
    {
      id: "vendor/coder-pro",
      name: "Coder Pro",
      context_length: 128000,
      pricing: { prompt: "0.01", completion: "0.01" }
    },
    {
      id: "vendor/code-helper",
      name: "Code Helper",
      context_length: 64000,
      pricing: { prompt: "0", completion: "0.000000" }
    }
  ];

  const app = createApp({
    document: dom.window.document,
    globalScope: dom.window,
    enrichments: ENRICHMENTS,
    modelUtils: ModelUtils,
    requestAnimationFrame: createImmediateRaf(),
    fetch: async () => ({
      ok: true,
      json: async () => ({ data: models })
    })
  });

  const initialized = await app.init();
  assert.equal(initialized, true);

  const cards = [...dom.window.document.querySelectorAll(".model-card")];
  assert.equal(cards.length, 2);
  assert.equal(dom.window.document.getElementById("freeModelCount").textContent, "2");
  assert.equal(dom.window.document.getElementById("statusMessage").textContent, "Showing 2 free models.");

  const ids = cards.map((card) => card.querySelector(".model-meta").textContent.trim());
  assert.deepEqual(ids, ["vendor/code-helper", "vendor/assistant-lite"]);
});

test("applyFilter reduces visible models to selected use case", async () => {
  const dom = createDom();
  const models = [
    {
      id: "vendor/assistant-base",
      name: "Assistant Base",
      context_length: 32000,
      pricing: { prompt: "0", completion: "0" }
    },
    {
      id: "vendor/coder-mini",
      name: "Coder Mini",
      context_length: 64000,
      pricing: { prompt: "0", completion: "0" }
    }
  ];

  const app = createApp({
    document: dom.window.document,
    globalScope: dom.window,
    enrichments: ENRICHMENTS,
    modelUtils: ModelUtils,
    requestAnimationFrame: createImmediateRaf(),
    fetch: async () => ({
      ok: true,
      json: async () => ({ data: models })
    })
  });

  await app.init();

  const filter = dom.window.document.getElementById("useCaseFilter");
  filter.value = "Coding";
  filter.dispatchEvent(new dom.window.Event("change"));

  const cards = dom.window.document.querySelectorAll(".model-card");
  assert.equal(cards.length, 1);
  assert.equal(cards[0].getAttribute("data-category"), "Coding");
  assert.equal(dom.window.document.getElementById("statusMessage").textContent, "Showing 1 free models.");
});

test("fetch failure shows fallback message and clears grid", async () => {
  const dom = createDom();
  dom.window.console.error = () => {};
  dom.window.document.getElementById("modelsGrid").innerHTML = "<article class='model-card'></article>";

  const app = createApp({
    document: dom.window.document,
    globalScope: dom.window,
    enrichments: ENRICHMENTS,
    modelUtils: ModelUtils,
    requestAnimationFrame: createImmediateRaf(),
    fetch: async () => {
      throw new Error("network down");
    }
  });

  await app.init();

  assert.equal(
    dom.window.document.getElementById("statusMessage").textContent,
    "Couldn't load live models right now. Please refresh in a moment."
  );
  assert.equal(dom.window.document.getElementById("freeModelCount").textContent, "0");
  assert.equal(dom.window.document.querySelectorAll(".model-card").length, 0);
});
