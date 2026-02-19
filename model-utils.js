(function (globalScope) {
  const CATEGORIES = ["Writing", "Coding", "Learning", "Business", "Creative"];

  function parsePrice(rawPrice) {
    if (rawPrice === null || rawPrice === undefined || rawPrice === "") {
      return Number.POSITIVE_INFINITY;
    }

    const numericPrice = Number.parseFloat(String(rawPrice));
    return Number.isFinite(numericPrice) ? numericPrice : Number.POSITIVE_INFINITY;
  }

  function isFreeModel(model) {
    const promptPrice = parsePrice(model?.pricing?.prompt);
    const completionPrice = parsePrice(model?.pricing?.completion);
    return promptPrice <= 0 && completionPrice <= 0;
  }

  function deterministicCategory(source) {
    let hash = 0;

    for (let index = 0; index < source.length; index += 1) {
      hash = (hash * 31 + source.charCodeAt(index)) % 2147483647;
    }

    return CATEGORIES[hash % CATEGORIES.length];
  }

  function chooseCategory(model) {
    const source = `${model?.id || ""} ${model?.name || ""}`.toLowerCase();

    if (source.includes("code") || source.includes("coder") || source.includes("program")) return "Coding";
    if (source.includes("vision") || source.includes("image") || source.includes("creative")) return "Creative";
    if (source.includes("learn") || source.includes("edu") || source.includes("instruct")) return "Learning";
    if (source.includes("chat") || source.includes("assistant")) return "Writing";

    return deterministicCategory(source);
  }

  const exported = {
    CATEGORIES,
    chooseCategory,
    isFreeModel,
    parsePrice
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
  }

  globalScope.ModelUtils = exported;
})(typeof window !== "undefined" ? window : globalThis);
