const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

const modelsGrid = document.getElementById("modelsGrid");
const statusMessage = document.getElementById("statusMessage");
const freeModelCount = document.getElementById("freeModelCount");
const useCaseFilter = document.getElementById("useCaseFilter");

let allModels = [];

function spawnParticles() {
  const container = document.getElementById("particles");
  if (!container) return;

  for (let i = 0; i < 24; i += 1) {
    const particle = document.createElement("span");
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.bottom = `${Math.random() * 45}px`;
    particle.style.animationDelay = `${Math.random() * 6}s`;
    particle.style.animationDuration = `${6 + Math.random() * 7}s`;
    container.appendChild(particle);
  }
}

function getProviderInfo(model) {
  const providerSource = `${model.id} ${model.name || ""}`.toLowerCase();
  const providerEntries = Object.entries(window.MODEL_ENRICHMENTS.providers);

  for (const [key, value] of providerEntries) {
    if (providerSource.includes(key)) {
      return value;
    }
  }

  return { label: "Community", logo: "🌐" };
}

function formatContextWindow(contextLength) {
  const tokens = Number(contextLength || 0);
  if (!tokens) return "Context window unavailable";

  const approxPages = Math.max(1, Math.round(tokens / 900));
  return `${tokens.toLocaleString()} tokens · Can read about a ${approxPages}-page book at once`;
}

function assignDifficulty(contextLength) {
  const tokens = Number(contextLength || 0);

  if (tokens <= 32000) return { label: "🟢 Beginner Friendly", className: "difficulty-beginner" };
  if (tokens <= 128000) return { label: "🟡 Intermediate", className: "difficulty-intermediate" };
  return { label: "🔴 Power User", className: "difficulty-power" };
}

function titleCaseId(modelId) {
  return modelId
    .split("/")
    .pop()
    .split(/[-_:]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getModelLink(model) {
  if (model.id) return `https://openrouter.ai/models/${model.id}`;
  const encodedModel = encodeURIComponent(model.name || "");
  return `https://openrouter.ai/playground?model=${encodedModel}`;
}

function renderSkeleton(count = 6) {
  modelsGrid.innerHTML = "";
  for (let i = 0; i < count; i += 1) {
    const card = document.createElement("div");
    card.className = "loading-card";
    modelsGrid.appendChild(card);
  }
}

function animateCount(target) {
  const start = Number(freeModelCount.textContent) || 0;
  const duration = 700;
  const startTime = performance.now();

  const tick = (now) => {
    const progress = Math.min(1, (now - startTime) / duration);
    const current = Math.round(start + (target - start) * progress);
    freeModelCount.textContent = current.toString();
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

function renderModels(models) {
  if (!models.length) {
    statusMessage.textContent = "No models match this filter yet. Try another use case.";
    modelsGrid.innerHTML = "";
    return;
  }

  statusMessage.textContent = `Showing ${models.length} free models.`;
  modelsGrid.innerHTML = models
    .map((model) => {
      const provider = getProviderInfo(model);
      const contextExplain = formatContextWindow(model.context_length);
      const difficulty = assignDifficulty(model.context_length);
      const category = window.ModelUtils.chooseCategory(model);
      const useCases = window.MODEL_ENRICHMENTS.useCasesByCategory[category].slice(0, 4);
      const friendlyName = model.name || titleCaseId(model.id);

      return `
        <article class="model-card" data-category="${category}">
          <div class="badges-row">
            <span class="badge">${provider.logo} ${provider.label}</span>
            <span class="badge ${difficulty.className}">${difficulty.label}</span>
          </div>
          <h3>${friendlyName}</h3>
          <p class="model-meta">${model.id}</p>
          <p class="context-explain">${contextExplain}</p>
          <div class="use-case-grid">
            ${useCases.map((useCase) => `<div class="use-case">${useCase}</div>`).join("")}
          </div>
          <a class="cta" href="${getModelLink(model)}" target="_blank" rel="noreferrer">Try It Free</a>
        </article>
      `;
    })
    .join("");
}

function applyFilter() {
  const selected = useCaseFilter.value;
  if (selected === "All") {
    renderModels(allModels);
    return;
  }

  const filtered = allModels.filter((model) => window.ModelUtils.chooseCategory(model) === selected);
  renderModels(filtered);
}

async function fetchFreeModels() {
  renderSkeleton();
  statusMessage.textContent = "Fetching live models from OpenRouter…";

  try {
    const response = await fetch(OPENROUTER_MODELS_URL, {
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`OpenRouter returned ${response.status}`);
    }

    const payload = await response.json();
    const models = Array.isArray(payload.data) ? payload.data : [];

    allModels = models
      .filter((model) => window.ModelUtils.isFreeModel(model))
      .sort((a, b) => (b.context_length || 0) - (a.context_length || 0));

    animateCount(allModels.length);
    applyFilter();
  } catch (error) {
    statusMessage.textContent = "Couldn't load live models right now. Please refresh in a moment.";
    modelsGrid.innerHTML = "";
    freeModelCount.textContent = "0";
    console.error(error);
  }
}

useCaseFilter.addEventListener("change", applyFilter);
spawnParticles();
fetchFreeModels();
