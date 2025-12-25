var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => JsonFlashcardPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// i18n.ts
var TRANSLATIONS = {
  en: {
    json_error: "JSON Error: ",
    launch_quiz: "Launch Quiz",
    launch_flashcards: "Launch Flashcards",
    last_score: "Last score: ",
    prev_score: "Previous: ",
    none: "None",
    next: "Next",
    finish: "Finish",
    validate: "Validate",
    completed: "Completed! \u{1F389}",
    final_score: "Final score: ",
    incorrect: "Incorrect",
    correct: "Correct",
    settings_language: "Language",
    settings_language_desc: "Choose the language for the plugin interface."
  },
  fr: {
    json_error: "Erreur JSON : ",
    launch_quiz: "Lancer le Quizz",
    launch_flashcards: "Lancer les Flashcards",
    last_score: "Dernier score : ",
    prev_score: "Pr\xE9c\xE9dent : ",
    none: "Aucun",
    next: "Suivant",
    finish: "Terminer",
    validate: "Valider",
    completed: "Termin\xE9 ! \u{1F389}",
    final_score: "Score final : ",
    incorrect: "Incorrect",
    correct: "Correct",
    settings_language: "Langue",
    settings_language_desc: "Choisissez la langue de l'interface du plugin."
  }
};
function t(key, lang = "en") {
  return TRANSLATIONS[lang][key] || TRANSLATIONS["en"][key];
}

// main.ts
var DEFAULT_SETTINGS = {
  lastScores: {},
  language: "en"
};
function hashCode(s) {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
var JsonFlashcardPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.activeLaunchers = /* @__PURE__ */ new Map();
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new JsonFlashcardSettingTab(this.app, this));
    this.registerMarkdownCodeBlockProcessor("flashcard", async (source, el, ctx) => {
      this.renderLauncher(source, el, ctx, "flashcard");
    });
    this.registerMarkdownCodeBlockProcessor("quizz", async (source, el, ctx) => {
      this.renderLauncher(source, el, ctx, "quizz");
    });
  }
  async renderLauncher(source, el, ctx, type) {
    try {
      const data = JSON.parse(source);
      let items = [];
      if (data.file) {
        const file = this.app.vault.getAbstractFileByPath(data.file);
        if (file instanceof import_obsidian.TFile) {
          items = JSON.parse(await this.app.vault.read(file));
        }
      } else {
        items = Array.isArray(data) ? data : data.items || [];
      }
      const deckId = data.id || data.file || `${ctx.sourcePath}#${hashCode(source)}`;
      const child = new LauncherChild(el, this, deckId, type, items);
      ctx.addChild(child);
    } catch (e) {
      el.createEl("pre", { text: t("json_error", this.settings.language) + e.message });
    }
  }
  refreshLaunchers(deckId) {
    const launchers = this.activeLaunchers.get(deckId);
    if (launchers) {
      launchers.forEach((l) => l.refresh());
    }
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
var LauncherChild = class extends import_obsidian.MarkdownRenderChild {
  constructor(containerEl, plugin, deckId, type, items) {
    super(containerEl);
    this.plugin = plugin;
    this.deckId = deckId;
    this.type = type;
    this.items = items;
  }
  onload() {
    let launchers = this.plugin.activeLaunchers.get(this.deckId);
    if (!launchers) {
      launchers = /* @__PURE__ */ new Set();
      this.plugin.activeLaunchers.set(this.deckId, launchers);
    }
    launchers.add(this);
    this.render();
  }
  onunload() {
    const launchers = this.plugin.activeLaunchers.get(this.deckId);
    if (launchers) {
      launchers.delete(this);
      if (launchers.size === 0) this.plugin.activeLaunchers.delete(this.deckId);
    }
  }
  render() {
    this.containerEl.empty();
    const container = this.containerEl.createDiv({ cls: "fc-launcher-container" });
    this.badgeEl = container.createDiv({ cls: "fc-last-score-badge" });
    this.refresh();
    const label = this.type === "quizz" ? t("launch_quiz", this.plugin.settings.language) : t("launch_flashcards", this.plugin.settings.language);
    const btn = container.createEl("button", {
      text: `${label} (${this.items.length})`,
      cls: "mod-cta"
    });
    btn.onclick = () => {
      if (this.type === "flashcard") new FlashcardModal(this.plugin.app, this.items, this.deckId, this.plugin).open();
      else new QuizModal(this.plugin.app, this.items, this.deckId, this.plugin).open();
    };
  }
  refresh() {
    const lastScore = this.plugin.settings.lastScores[this.deckId];
    if (lastScore) {
      this.badgeEl.setText(`${t("last_score", this.plugin.settings.language)}${lastScore}`);
      this.badgeEl.removeClass("is-hidden");
    } else {
      this.badgeEl.setText("");
      this.badgeEl.addClass("is-hidden");
    }
  }
};
var BaseModal = class extends import_obsidian.Modal {
  constructor(app, deckId, plugin) {
    super(app);
    this.deckId = deckId;
    this.plugin = plugin;
    this.currentIndex = 0;
    this.correctCount = 0;
    this.viewedCount = 0;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.swipeThreshold = 50;
  }
  onOpen() {
    this.contentEl.empty();
    this.contentEl.addClass("fc-modal-full");
    const header = this.contentEl.createDiv({ cls: "fc-header-container" });
    const scoreRow = header.createDiv({ cls: "fc-score-row" });
    const lastScore = this.plugin.settings.lastScores[this.deckId] || t("none", this.plugin.settings.language);
    scoreRow.createEl("span", { text: `${t("prev_score", this.plugin.settings.language)}${lastScore}`, cls: "fc-prev-score" });
    const progressWrapper = header.createDiv({ cls: "fc-progress-wrapper" });
    const progressBg = progressWrapper.createDiv({ cls: "fc-progress-bg" });
    this.progressFillEl = progressBg.createDiv({ cls: "fc-progress-fill" });
    this.progressTextEl = progressWrapper.createDiv({ cls: "fc-progress-label" });
    this.renderGame(this.contentEl);
    this.setupSwipe();
  }
  updateProgressUI(total) {
    const current = this.currentIndex + 1;
    const percent = current / total * 100;
    this.progressFillEl.style.width = `${percent}%`;
    this.progressTextEl.setText(`${current} / ${total}`);
  }
  setupSwipe() {
    this.contentEl.addEventListener("touchstart", (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
      this.touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    this.contentEl.addEventListener("touchend", (e) => {
      const endX = e.changedTouches[0].screenX;
      const endY = e.changedTouches[0].screenY;
      const diffX = endX - this.touchStartX;
      const diffY = endY - this.touchStartY;
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > this.swipeThreshold) this.handleSwipe(diffX > 0 ? "right" : "left");
      } else {
        if (Math.abs(diffY) > this.swipeThreshold) this.handleSwipe(diffY > 0 ? "down" : "up");
      }
    }, { passive: true });
  }
  async updateScore(isCorrect) {
    this.viewedCount++;
    if (isCorrect) this.correctCount++;
    this.plugin.settings.lastScores[this.deckId] = `${this.correctCount}/${this.viewedCount}`;
  }
  onClose() {
    this.plugin.saveSettings();
    this.plugin.refreshLaunchers(this.deckId);
  }
};
var QuizModal = class extends BaseModal {
  constructor(app, questions, deckId, plugin) {
    super(app, deckId, plugin);
    this.selectedOptions = /* @__PURE__ */ new Set();
    this.isAnswered = false;
    this.questions = [...questions].sort(() => Math.random() - 0.5);
  }
  renderGame(contentEl) {
    this.gameContainer = contentEl.createDiv({ cls: "fc-game-container" });
    this.displayQuestion();
  }
  handleSwipe(direction) {
    if (direction === "left" || direction === "right") this.handleAction();
  }
  async handleAction() {
    const q = this.questions[this.currentIndex];
    if (this.isAnswered) {
      if (this.currentIndex < this.questions.length - 1) {
        this.currentIndex++;
        this.displayQuestion(true);
      } else {
        this.showFinalScore();
      }
      return;
    }
    this.isAnswered = true;
    const correctIndices = q.options.map((o, i) => o.correct ? i : null).filter((i) => i !== null);
    const isCorrect = correctIndices.length === this.selectedOptions.size && correctIndices.every((i) => this.selectedOptions.has(i));
    await this.updateScore(isCorrect);
    const shuffledOptions = this.optionsList._shuffledOptions;
    Array.from(this.optionsList.children).forEach((child, idx) => {
      const opt = shuffledOptions[idx];
      child.removeClass("is-selected");
      if (opt.correct) child.addClass("is-correct");
      else if (this.selectedOptions.has(opt.originalIndex)) child.addClass("is-wrong");
    });
    this.actionBtn.setText(this.currentIndex < this.questions.length - 1 ? t("next", this.plugin.settings.language) : t("finish", this.plugin.settings.language));
  }
  displayQuestion(animate = false) {
    this.gameContainer.empty();
    if (animate) {
      this.gameContainer.addClass("slide-next");
      setTimeout(() => this.gameContainer.removeClass("slide-next"), 400);
    }
    this.isAnswered = false;
    this.selectedOptions.clear();
    this.updateProgressUI(this.questions.length);
    const q = this.questions[this.currentIndex];
    const shuffledOptions = [...q.options].map((opt, index) => ({ ...opt, originalIndex: index })).sort(() => Math.random() - 0.5);
    this.gameContainer.createEl("h2", { text: q.question, cls: "fc-question-text" });
    this.optionsList = this.gameContainer.createDiv({ cls: "fc-options-list" });
    this.optionsList._shuffledOptions = shuffledOptions;
    shuffledOptions.forEach((opt) => {
      const btn = this.optionsList.createEl("button", { text: opt.text, cls: "fc-option-btn" });
      btn.onclick = () => {
        if (this.isAnswered) return;
        btn.toggleClass("is-selected", !btn.hasClass("is-selected"));
        if (btn.hasClass("is-selected")) this.selectedOptions.add(opt.originalIndex);
        else this.selectedOptions.delete(opt.originalIndex);
      };
    });
    this.actionBtn = this.gameContainer.createEl("button", { text: t("validate", this.plugin.settings.language), cls: "fc-btn-validate mod-cta" });
    this.actionBtn.onclick = () => this.handleAction();
  }
  showFinalScore() {
    this.gameContainer.empty();
    this.gameContainer.createEl("h2", { text: t("completed", this.plugin.settings.language) });
    this.gameContainer.createEl("div", { text: `${t("final_score", this.plugin.settings.language)}${this.correctCount}/${this.viewedCount}`, cls: "fc-final-score" });
  }
};
var FlashcardModal = class extends BaseModal {
  constructor(app, cards, deckId, plugin) {
    super(app, deckId, plugin);
    this.isFlipped = false;
    this.hasBeenFlipped = false;
    this.isAnimating = false;
    this.cards = [...cards].sort(() => Math.random() - 0.5);
  }
  renderGame(contentEl) {
    const container = contentEl.createDiv({ cls: "fc-game-container" });
    this.cardContainer = container.createDiv({ cls: "fc-card-container" });
    const inner = this.cardContainer.createDiv({ cls: "fc-card-inner" });
    this.cardFront = inner.createDiv({ cls: "fc-card-front" });
    this.cardBack = inner.createDiv({ cls: "fc-card-back" });
    this.cardContainer.onclick = () => this.flip();
    this.scoreGroup = container.createDiv({ cls: "fc-score-group is-hidden" });
    const btnWrong = this.scoreGroup.createEl("button", { text: t("incorrect", this.plugin.settings.language), cls: "fc-btn-wrong" });
    const btnRight = this.scoreGroup.createEl("button", { text: t("correct", this.plugin.settings.language), cls: "fc-btn-right" });
    btnWrong.onclick = () => this.record(false);
    btnRight.onclick = () => this.record(true);
    this.display();
  }
  handleSwipe(direction) {
    if (this.isAnimating) return;
    if (direction === "right") this.record(true);
    else if (direction === "left") this.record(false);
    else if (direction === "up") this.navigate(1, "swipe-up");
    else if (direction === "down") this.navigate(-1, "swipe-down");
  }
  display() {
    this.isFlipped = false;
    this.hasBeenFlipped = false;
    this.isAnimating = false;
    this.cardContainer.className = "fc-card-container";
    this.scoreGroup.addClass("is-hidden");
    this.updateProgressUI(this.cards.length);
    const card = this.cards[this.currentIndex];
    this.cardFront.setText(card.question);
    this.cardBack.setText(card.answer);
  }
  flip() {
    if (this.isAnimating) return;
    this.isFlipped = !this.isFlipped;
    this.cardContainer.toggleClass("is-flipped", this.isFlipped);
    if (this.isFlipped && !this.hasBeenFlipped) {
      this.hasBeenFlipped = true;
      this.scoreGroup.removeClass("is-hidden");
    }
  }
  async record(correct) {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.cardContainer.addClass(correct ? "swipe-right" : "swipe-left");
    await this.updateScore(correct);
    setTimeout(() => {
      if (this.currentIndex < this.cards.length - 1) {
        this.currentIndex++;
        this.display();
      } else {
        this.close();
      }
    }, 400);
  }
  navigate(direction, animationClass) {
    const nextIndex = this.currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= this.cards.length) return;
    this.isAnimating = true;
    this.cardContainer.addClass(animationClass);
    setTimeout(() => {
      this.currentIndex = nextIndex;
      this.display();
    }, 400);
  }
};
var JsonFlashcardSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName(t("settings_language", this.plugin.settings.language)).setDesc(t("settings_language_desc", this.plugin.settings.language)).addDropdown(
      (dropdown) => dropdown.addOption("en", "English").addOption("fr", "Fran\xE7ais").setValue(this.plugin.settings.language).onChange(async (value) => {
        this.plugin.settings.language = value;
        await this.plugin.saveSettings();
        this.display();
      })
    );
  }
};
