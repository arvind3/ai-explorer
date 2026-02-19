(function (globalScope) {
  const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

  function createApp(options = {}) {
    const root = options.globalScope || globalScope;
    const documentRef = options.document || root.document;
    const fetchImpl = options.fetch || root.fetch;
    const performanceRef = options.performance || root.performance;
    const requestAnimationFrameImpl =
      options.requestAnimationFrame ||
      root.requestAnimationFrame ||
      ((callback) => setTimeout(() => callback(Date.now()), 16));
    const modelUtils = options.modelUtils || root.ModelUtils;
    const enrichments = options.enrichments || root.MODEL_ENRICHMENTS;

    const modelsGrid = documentRef && documentRef.getElementById("modelsGrid");
    const statusMessage = documentRef && documentRef.getElementById("statusMessage");
    const freeModelCount = documentRef && documentRef.getElementById("freeModelCount");
    const useCaseFilter = documentRef && documentRef.getElementById("useCaseFilter");

    let allModels = [];

    function isReady() {
      return Boolean(
        documentRef &&
          modelsGrid &&
          statusMessage &&
          freeModelCount &&
          useCaseFilter &&
          modelUtils &&
          enrichments &&
          typeof fetchImpl === "function"
      );
    }

    function spawnParticles() {
      const container = documentRef.getElementById("particles");
      if (!container) return;

      for (let i = 0; i < 24; i += 1) {
        const particle = documentRef.createElement("span");
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.bottom = `${Math.random() * 45}px`;
        particle.style.animationDelay = `${Math.random() * 6}s`;
        particle.style.animationDuration = `${6 + Math.random() * 7}s`;
        container.appendChild(particle);
      }
    }

    function getProviderInfo(model) {
      const providerSource = `${model.id} ${model.name || ""}`.toLowerCase();
      const providerEntries = Object.entries(enrichments.providers || {});

      for (const [key, value] of providerEntries) {
        if (providerSource.includes(key)) {
          return value;
        }
      }

      return { label: "Community", logo: "\uD83C\uDF10" };
    }

    function formatContextWindow(contextLength) {
      const tokens = Number(contextLength || 0);
      if (!tokens) return "Context window unavailable";

      const approxPages = Math.max(1, Math.round(tokens / 900));
      return `${tokens.toLocaleString()} tokens Â· Can read about a ${approxPages}-page book at once`;
    }

    function assignDifficulty(contextLength) {
      const tokens = Number(contextLength || 0);

      if (tokens <= 32000) return { label: "\uD83D\uDFE2 Beginner Friendly", className: "difficulty-beginner" };
      if (tokens <= 128000) return { label: "\uD83D\uDFE1 Intermediate", className: "difficulty-intermediate" };
      return { label: "\uD83D\uDD34 Power User", className: "difficulty-power" };
    }

    function titleCaseId(modelId) {
      return String(modelId || "")
        .split("/")
        .pop()
        .split(/[-_:]/g)
        .filter(Boolean)
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
        const card = documentRef.createElement("div");
        card.className = "loading-card";
        modelsGrid.appendChild(card);
      }
    }

    function animateCount(target) {
      const start = Number(freeModelCount.textContent) || 0;
      const duration = 700;
      const startTime = typeof performanceRef.now === "function" ? performanceRef.now() : Date.now();

      const tick = (now) => {
        const progress = Math.min(1, (now - startTime) / duration);
        const current = Math.round(start + (target - start) * progress);
        freeModelCount.textContent = current.toString();
        if (progress < 1) requestAnimationFrameImpl(tick);
      };

      requestAnimationFrameImpl(tick);
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
          const category = modelUtils.chooseCategory(model);
          const categoryUseCases =
            (enrichments.useCasesByCategory &&
              Array.isArray(enrichments.useCasesByCategory[category]) &&
              enrichments.useCasesByCategory[category]) ||
            [];
          const useCases = categoryUseCases.slice(0, 4);
          const friendlyName = model.name || titleCaseId(model.id) || "Unnamed Model";

          return `
        <article class="model-card" data-category="${category}">
          <div class="badges-row">
            <span class="badge">${provider.logo} ${provider.label}</span>
            <span class="badge ${difficulty.className}">${difficulty.label}</span>
          </div>
          <h3>${friendlyName}</h3>
          <p class="model-meta">${model.id || "Unknown model id"}</p>
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

      const filtered = allModels.filter((model) => modelUtils.chooseCategory(model) === selected);
      renderModels(filtered);
    }

    async function fetchFreeModels() {
      renderSkeleton();
      statusMessage.textContent = "Fetching live models from OpenRouter...";

      try {
        const response = await fetchImpl(OPENROUTER_MODELS_URL, {
          headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
          throw new Error(`OpenRouter returned ${response.status}`);
        }

        const payload = await response.json();
        const models = Array.isArray(payload.data) ? payload.data : [];

        allModels = models
          .filter((model) => modelUtils.isFreeModel(model))
          .sort((a, b) => (b.context_length || 0) - (a.context_length || 0));

        animateCount(allModels.length);
        applyFilter();
      } catch (error) {
        statusMessage.textContent = "Couldn't load live models right now. Please refresh in a moment.";
        modelsGrid.innerHTML = "";
        freeModelCount.textContent = "0";
        if (root.console && typeof root.console.error === "function") {
          root.console.error(error);
        }
      }
    }

    async function init() {
      if (!isReady()) return false;
      useCaseFilter.addEventListener("change", applyFilter);
      spawnParticles();
      await fetchFreeModels();
      return true;
    }

    return {
      OPENROUTER_MODELS_URL,
      applyFilter,
      fetchFreeModels,
      getModelLink,
      init,
      renderModels
    };
  }

  const exported = {
    OPENROUTER_MODELS_URL,
    createApp
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
  }

  if (globalScope && globalScope.document) {
    const app = createApp();
    globalScope.__AI_EXPLORER_APP__ = app;
    app.init();
  }
})(typeof window !== "undefined" ? window : globalThis);