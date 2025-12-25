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
    settings_language_desc: "Choose the language for the plugin interface.",
    menu_insert: "Insert Quiz/Flashcard",
    menu_quiz: "Quiz",
    menu_quiz_json: "Quiz from JSON file",
    menu_flashcard: "Flashcard",
    menu_flashcard_json: "Flashcard from JSON file",
    ribbon_all_flashcards: "All Flashcards",
    select_folder_title: "Select Folders",
    all_vault: "All Vault",
    select_folders: "Select specific folders"
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
    settings_language_desc: "Choisissez la langue de l'interface du plugin.",
    menu_insert: "Ins\xE9rer Quizz/Flashcard",
    menu_quiz: "Quizz",
    menu_quiz_json: "Quizz depuis un fichier JSON",
    menu_flashcard: "Flashcard",
    menu_flashcard_json: "Flashcard depuis un fichier JSON",
    ribbon_all_flashcards: "Toutes les Flashcards",
    select_folder_title: "S\xE9lectionner les dossiers",
    all_vault: "Tout le coffre",
    select_folders: "S\xE9lectionner des dossiers sp\xE9cifiques"
  },
  de: {
    json_error: "JSON-Fehler: ",
    launch_quiz: "Quiz starten",
    launch_flashcards: "Flashcards starten",
    last_score: "Letztes Ergebnis: ",
    prev_score: "Vorheriges: ",
    none: "Keines",
    next: "Weiter",
    finish: "Beenden",
    validate: "Validieren",
    completed: "Abgeschlossen! \u{1F389}",
    final_score: "Endergebnis: ",
    incorrect: "Falsch",
    correct: "Richtig",
    settings_language: "Sprache",
    settings_language_desc: "W\xE4hlen Sie die Sprache f\xFCr die Plugin-Oberfl\xE4che.",
    menu_insert: "Quiz/Flashcard einf\xFCgen",
    menu_quiz: "Quiz",
    menu_quiz_json: "Quiz aus JSON-Datei",
    menu_flashcard: "Flashcard",
    menu_flashcard_json: "Flashcard aus JSON-Datei",
    ribbon_all_flashcards: "Alle Flashcards",
    select_folder_title: "Ordner ausw\xE4hlen",
    all_vault: "Gesamter Vault",
    select_folders: "Bestimmte Ordner ausw\xE4hlen"
  },
  es: {
    json_error: "Error de JSON: ",
    launch_quiz: "Iniciar Cuestionario",
    launch_flashcards: "Iniciar Flashcards",
    last_score: "\xDAltima puntuaci\xF3n: ",
    prev_score: "Anterior: ",
    none: "Ninguno",
    next: "Siguiente",
    finish: "Terminar",
    validate: "Validar",
    completed: "\xA1Completado! \u{1F389}",
    final_score: "Puntuaci\xF3n final: ",
    incorrect: "Incorrecto",
    correct: "Correcto",
    settings_language: "Idioma",
    settings_language_desc: "Elige el idioma para la interfaz del complemento.",
    menu_insert: "Insertar Cuestionario/Flashcard",
    menu_quiz: "Cuestionario",
    menu_quiz_json: "Cuestionario desde archivo JSON",
    menu_flashcard: "Flashcard",
    menu_flashcard_json: "Flashcard desde archivo JSON",
    ribbon_all_flashcards: "Todas las Flashcards",
    select_folder_title: "Seleccionar carpetas",
    all_vault: "Todo el almac\xE9n",
    select_folders: "Seleccionar carpetas espec\xEDficas"
  },
  zh: {
    json_error: "JSON \u9519\u8BEF: ",
    launch_quiz: "\u5F00\u59CB\u6D4B\u9A8C",
    launch_flashcards: "\u5F00\u59CB\u62BD\u8BA4\u5361",
    last_score: "\u6700\u8FD1\u5F97\u5206: ",
    prev_score: "\u4E0A\u6B21\u5F97\u5206: ",
    none: "\u65E0",
    next: "\u4E0B\u4E00\u6B65",
    finish: "\u5B8C\u6210",
    validate: "\u9A8C\u8BC1",
    completed: "\u5DF2\u5B8C\u6210\uFF01\u{1F389}",
    final_score: "\u6700\u7EC8\u5F97\u5206: ",
    incorrect: "\u9519\u8BEF",
    correct: "\u6B63\u786E",
    settings_language: "\u8BED\u8A00",
    settings_language_desc: "\u9009\u62E9\u63D2\u4EF6\u754C\u9762\u7684\u8BED\u8A00\u3002",
    menu_insert: "\u63D2\u5165\u6D4B\u9A8C/\u62BD\u8BA4\u5361",
    menu_quiz: "\u6D4B\u9A8C",
    menu_quiz_json: "\u4ECE JSON \u6587\u4EF6\u63D2\u5165\u6D4B\u9A8C",
    menu_flashcard: "\u62BD\u8BA4\u5361",
    menu_flashcard_json: "\u4ECE JSON \u6587\u4EF6\u63D2\u5165\u62BD\u8BA4\u5361",
    ribbon_all_flashcards: "\u6240\u6709\u62BD\u8BA4\u5361",
    select_folder_title: "\u9009\u62E9\u6587\u4EF6\u5939",
    all_vault: "\u6574\u4E2A\u4FDD\u9669\u5E93",
    select_folders: "\u9009\u62E9\u7279\u5B9A\u6587\u4EF6\u5939"
  },
  ja: {
    json_error: "JSON\u30A8\u30E9\u30FC: ",
    launch_quiz: "\u30AF\u30A4\u30BA\u3092\u958B\u59CB",
    launch_flashcards: "\u30D5\u30E9\u30C3\u30B7\u30E5\u30AB\u30FC\u30C9\u3092\u958B\u59CB",
    last_score: "\u6700\u65B0\u30B9\u30B3\u30A2: ",
    prev_score: "\u524D\u56DE\u306E\u30B9\u30B3\u30A2: ",
    none: "\u306A\u3057",
    next: "\u6B21\u3078",
    finish: "\u7D42\u4E86",
    validate: "\u78BA\u8A8D",
    completed: "\u5B8C\u4E86\uFF01\u{1F389}",
    final_score: "\u6700\u7D42\u30B9\u30B3\u30A2: ",
    incorrect: "\u4E0D\u6B63\u89E3",
    correct: "\u6B63\u89E3",
    settings_language: "\u8A00\u8A9E",
    settings_language_desc: "\u30D7\u30E9\u30B0\u30A4\u30F3\u306E\u8868\u793A\u8A00\u8A9E\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    menu_insert: "\u30AF\u30A4\u30BA/\u30D5\u30E9\u30C3\u30B7\u30E5\u30AB\u30FC\u30C9\u3092\u633F\u5165",
    menu_quiz: "\u30AF\u30A4\u30BA",
    menu_quiz_json: "JSON\u30D5\u30A1\u30A4\u30EB\u304B\u3089\u30AF\u30A4\u30BA\u3092\u633F\u5165",
    menu_flashcard: "\u30D5\u30E9\u30C3\u30B7\u30E5\u30AB\u30FC\u30C9",
    menu_flashcard_json: "JSON\u30D5\u30A1\u30A4\u30EB\u304B\u3089\u30D5\u30E9\u30C3\u30B7\u30E5\u30AB\u30FC\u30C9\u3092\u633F\u5165",
    ribbon_all_flashcards: "\u3059\u3079\u3066\u306E\u30D5\u30E9\u30C3\u30B7\u30E5\u30AB\u30FC\u30C9",
    select_folder_title: "\u30D5\u30A9\u30EB\u30C0\u3092\u9078\u629E",
    all_vault: "\u3059\u3079\u3066\u306E\u4FDD\u7BA1\u5EAB",
    select_folders: "\u7279\u5B9A\u306E\u30D5\u30A9\u30EB\u30C0\u3092\u9078\u629E"
  },
  pt: {
    json_error: "Erro de JSON: ",
    launch_quiz: "Iniciar Question\xE1rio",
    launch_flashcards: "Iniciar Flashcards",
    last_score: "\xDAltima pontua\xE7\xE3o: ",
    prev_score: "Anterior: ",
    none: "Nenhum",
    next: "Pr\xF3ximo",
    finish: "Finalizar",
    validate: "Validar",
    completed: "Conclu\xEDdo! \u{1F389}",
    final_score: "Pontua\xE7\xE3o final: ",
    incorrect: "Incorreto",
    correct: "Correto",
    settings_language: "Idioma",
    settings_language_desc: "Escolha o idioma da interface do plugin.",
    menu_insert: "Inserir Question\xE1rio/Flashcard",
    menu_quiz: "Question\xE1rio",
    menu_quiz_json: "Question\xE1rio de arquivo JSON",
    menu_flashcard: "Flashcard",
    menu_flashcard_json: "Flashcard de arquivo JSON",
    ribbon_all_flashcards: "Todas as Flashcards",
    select_folder_title: "Selecionar pastas",
    all_vault: "Todo o cofre",
    select_folders: "Selecionar pastas espec\xEDficas"
  }
};
function t(key, lang = "en") {
  return TRANSLATIONS[lang] && TRANSLATIONS[lang][key] || TRANSLATIONS["en"][key];
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
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor) => {
        menu.addItem((mainItem) => {
          mainItem.setTitle(t("menu_insert", this.settings.language)).setIcon("zap").setSection("insert");
          const subMenu = mainItem.setSubmenu();
          subMenu.addItem((item) => {
            item.setTitle(t("menu_quiz", this.settings.language)).setIcon("list-checks").onClick(() => {
              const template = '```quizz\n[\n  {\n    "question": "",\n    "options": [\n      { "text": "", "correct": true },\n      { "text": "", "correct": false }\n    ]\n  }\n]\n```';
              editor.replaceSelection(template);
            });
          });
          subMenu.addItem((item) => {
            item.setTitle(t("menu_quiz_json", this.settings.language)).setIcon("file-json").onClick(() => {
              const template = '```quizz\n{\n  "file": "path/to/your/file.json"\n}\n```';
              editor.replaceSelection(template);
            });
          });
          subMenu.addItem((item) => {
            item.setTitle(t("menu_flashcard", this.settings.language)).setIcon("layers").onClick(() => {
              const template = '```flashcard\n[\n  {\n    "question": "",\n    "answer": ""\n  }\n]\n```';
              editor.replaceSelection(template);
            });
          });
          subMenu.addItem((item) => {
            item.setTitle(t("menu_flashcard_json", this.settings.language)).setIcon("file-json").onClick(() => {
              const template = '```flashcard\n{\n  "file": "path/to/your/file.json"\n}\n```';
              editor.replaceSelection(template);
            });
          });
        });
      })
    );
    this.addRibbonIcon("layers", t("ribbon_all_flashcards", this.settings.language), () => {
      new FolderSelectionModal(this.app, this).open();
    });
  }
  async launchAllFlashcards(folderPaths) {
    const flashcards = [];
    const files = this.app.vault.getMarkdownFiles();
    for (const file of files) {
      if (folderPaths && folderPaths.length > 0) {
        const isInSelectedFolder = folderPaths.some((path) => file.path.startsWith(path));
        if (!isInSelectedFolder) continue;
      }
      const content = await this.app.vault.read(file);
      const regex = /```flashcard\n([\s\S]*?)\n```/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        try {
          const source = match[1];
          const data = JSON.parse(source);
          let items = [];
          if (data.file) {
            const jsonFile = this.app.vault.getAbstractFileByPath(data.file);
            if (jsonFile instanceof import_obsidian.TFile) {
              items = JSON.parse(await this.app.vault.read(jsonFile));
            }
          } else {
            items = Array.isArray(data) ? data : data.items || [];
          }
          flashcards.push(...items);
        } catch (e) {
          console.error(`Error parsing flashcards in ${file.path}:`, e);
        }
      }
    }
    if (flashcards.length > 0) {
      const deckId = folderPaths && folderPaths.length > 0 ? `all-flashcards:${folderPaths.sort().join(",")}` : "all-flashcards";
      new FlashcardModal(this.app, flashcards, deckId, this).open();
    } else {
      new import_obsidian.Notice(t("none", this.settings.language));
    }
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
      const child = new LauncherChild(el, this, deckId, type, items, data.img, ctx);
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
  constructor(containerEl, plugin, deckId, type, items, imgUrl, ctx) {
    super(containerEl);
    this.plugin = plugin;
    this.deckId = deckId;
    this.type = type;
    this.items = items;
    this.imgUrl = imgUrl;
    this.ctx = ctx;
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
    if (this.imgUrl) {
      container.addClass("has-image");
      const finalUrl = this.resolveImageUrl(this.imgUrl);
      container.style.backgroundImage = `url("${finalUrl}")`;
    }
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
    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      container.addClass("is-dragging");
    });
    container.addEventListener("dragleave", () => {
      container.removeClass("is-dragging");
    });
    container.addEventListener("drop", async (e) => {
      e.preventDefault();
      container.removeClass("is-dragging");
      let newImgUrl = "";
      const text = e.dataTransfer?.getData("text/plain");
      if (text) {
        if (text.startsWith("obsidian://")) {
          newImgUrl = text;
        } else {
          const match = text.match(/\[\[(.*?)\]\]/) || [null, text];
          newImgUrl = match[1].split("|")[0].trim();
        }
      }
      if (newImgUrl) {
        this.imgUrl = newImgUrl;
        this.render();
        await this.updateSource(newImgUrl);
      }
    });
  }
  resolveImageUrl(url) {
    if (url.startsWith("http")) return url;
    let path = url;
    if (url.startsWith("obsidian://")) {
      try {
        const match = url.match(/[?&]file=([^&]+)/);
        if (match) path = decodeURIComponent(match[1]);
      } catch (e) {
        console.error("Failed to parse obsidian URL:", e);
      }
    }
    path = path.replace(/^\[\[/, "").replace(/\]\]$/, "").split("|")[0].trim();
    const file = this.plugin.app.metadataCache.getFirstLinkpathDest(path, "");
    if (file instanceof import_obsidian.TFile) {
      return this.plugin.app.vault.adapter.getResourcePath(file.path);
    }
    const abstractFile = this.plugin.app.vault.getAbstractFileByPath(path);
    if (abstractFile instanceof import_obsidian.TFile) {
      return this.plugin.app.vault.adapter.getResourcePath(abstractFile.path);
    }
    return url;
  }
  async updateSource(newImgUrl) {
    if (!this.ctx) return;
    const file = this.plugin.app.vault.getAbstractFileByPath(this.ctx.sourcePath);
    if (!(file instanceof import_obsidian.TFile)) return;
    const section = this.ctx.getSectionInfo(this.containerEl);
    if (!section) return;
    const content = await this.plugin.app.vault.read(file);
    const lines = content.split("\n");
    const blockLines = lines.slice(section.lineStart + 1, section.lineEnd);
    const blockSource = blockLines.join("\n");
    try {
      let data = JSON.parse(blockSource);
      if (Array.isArray(data)) {
        data = {
          img: newImgUrl,
          items: data
        };
      } else {
        data.img = newImgUrl;
      }
      const newBlockSource = JSON.stringify(data, null, 2);
      lines.splice(section.lineStart + 1, section.lineEnd - section.lineStart - 1, newBlockSource);
      await this.plugin.app.vault.modify(file, lines.join("\n"));
      new import_obsidian.Notice("Banner updated!");
    } catch (e) {
      console.error("Failed to update image in source:", e);
    }
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
    this.previousScore = this.plugin.settings.lastScores[this.deckId] || t("none", this.plugin.settings.language);
  }
  onOpen() {
    this.contentEl.empty();
    this.contentEl.addClass("fc-modal-full");
    const header = this.contentEl.createDiv({ cls: "fc-header-container" });
    const scoreRow = header.createDiv({ cls: "fc-score-row" });
    scoreRow.createEl("span", { text: `${t("prev_score", this.plugin.settings.language)}${this.previousScore}`, cls: "fc-prev-score" });
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
    new import_obsidian.Notice(`${t("final_score", this.plugin.settings.language)}${this.correctCount}/${this.viewedCount} (${t("prev_score", this.plugin.settings.language)}${this.previousScore})`);
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
    const scoreContainer = this.gameContainer.createDiv({ cls: "fc-final-score-container" });
    scoreContainer.createEl("div", { text: `${t("final_score", this.plugin.settings.language)}${this.correctCount}/${this.viewedCount}`, cls: "fc-final-score" });
    scoreContainer.createEl("div", { text: `${t("prev_score", this.plugin.settings.language)}${this.previousScore}`, cls: "fc-prev-score-final" });
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
        this.showFinalScore();
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
  showFinalScore() {
    this.cardContainer.addClass("is-hidden");
    this.scoreGroup.addClass("is-hidden");
    const finalContainer = this.cardContainer.parentElement?.createDiv({ cls: "fc-final-score-container" });
    if (finalContainer) {
      finalContainer.createEl("h2", { text: t("completed", this.plugin.settings.language) });
      finalContainer.createEl("div", { text: `${t("final_score", this.plugin.settings.language)}${this.correctCount}/${this.viewedCount}`, cls: "fc-final-score" });
      finalContainer.createEl("div", { text: `${t("prev_score", this.plugin.settings.language)}${this.previousScore}`, cls: "fc-prev-score-final" });
    }
  }
};
var FolderSelectionModal = class extends import_obsidian.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: t("select_folder_title", this.plugin.settings.language) });
    const container = contentEl.createDiv({ cls: "fc-folder-selection-container" });
    const allVaultBtn = container.createEl("button", {
      text: t("all_vault", this.plugin.settings.language),
      cls: "mod-cta fc-folder-btn"
    });
    allVaultBtn.onclick = () => {
      this.plugin.launchAllFlashcards();
      this.close();
    };
    container.createEl("hr");
    container.createEl("h3", { text: t("select_folders", this.plugin.settings.language) });
    const folderList = container.createDiv({ cls: "fc-folder-list" });
    const rootFolders = this.app.vault.getRoot().children.filter((f) => f instanceof import_obsidian.TFolder);
    rootFolders.forEach((folder) => {
      const folderBtn = folderList.createEl("button", {
        text: folder.name,
        cls: "fc-folder-item-btn"
      });
      folderBtn.onclick = () => {
        this.plugin.launchAllFlashcards([folder.path]);
        this.close();
      };
    });
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
      (dropdown) => dropdown.addOption("en", "English").addOption("fr", "Fran\xE7ais").addOption("de", "Deutsch").addOption("es", "Espa\xF1ol").addOption("zh", "\u7B80\u4F53\u4E2D\u6587").addOption("ja", "\u65E5\u672C\u8A9E").addOption("pt", "Portugu\xEAs").setValue(this.plugin.settings.language).onChange(async (value) => {
        this.plugin.settings.language = value;
        await this.plugin.saveSettings();
        this.display();
      })
    );
  }
};
