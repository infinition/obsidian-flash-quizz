import { App, Modal, Plugin, TFile, setIcon, MarkdownRenderChild, MarkdownPostProcessorContext, PluginSettingTab, Setting, Editor, Menu } from 'obsidian';
import { t, Language } from './i18n';

// --- INTERFACES ---

interface Flashcard {
    question: string;
    answer: string;
}

interface QuizOption {
    text: string;
    correct: boolean;
}

interface QuizQuestion {
    question: string;
    options: QuizOption[];
}

interface PluginSettings {
    lastScores: Record<string, string>;
    language: Language;
}

const DEFAULT_SETTINGS: PluginSettings = {
    lastScores: {},
    language: 'en'
};

function hashCode(s: string): string {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

export default class JsonFlashcardPlugin extends Plugin {
    settings: PluginSettings;
    activeLaunchers: Map<string, Set<LauncherChild>> = new Map();

    async onload() {
        await this.loadSettings();

        this.addSettingTab(new JsonFlashcardSettingTab(this.app, this));

        this.registerMarkdownCodeBlockProcessor("flashcard", async (source, el, ctx) => {
            this.renderLauncher(source, el, ctx, "flashcard");
        });

        this.registerMarkdownCodeBlockProcessor("quizz", async (source, el, ctx) => {
            this.renderLauncher(source, el, ctx, "quizz");
        });

        // --- AJOUT DU SOUS-MENU CONTEXTUEL ---
        this.registerEvent(
            this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor) => {
                menu.addItem((mainItem) => {
                    mainItem
                        .setTitle(t("menu_insert", this.settings.language))
                        .setIcon("zap")
                        .setSection("insert");

                    const subMenu = mainItem.setSubmenu();

                    subMenu.addItem((item) => {
                        item
                            .setTitle(t("menu_quiz", this.settings.language))
                            .setIcon("list-checks")
                            .onClick(() => {
                                const template = "```quizz\n[\n  {\n    \"question\": \"\",\n    \"options\": [\n      { \"text\": \"\", \"correct\": true },\n      { \"text\": \"\", \"correct\": false }\n    ]\n  }\n]\n```";
                                editor.replaceSelection(template);
                            });
                    });

                    subMenu.addItem((item) => {
                        item
                            .setTitle(t("menu_quiz_json", this.settings.language))
                            .setIcon("file-json")
                            .onClick(() => {
                                const template = "```quizz\n{\n  \"file\": \"path/to/your/file.json\"\n}\n```";
                                editor.replaceSelection(template);
                            });
                    });

                    subMenu.addItem((item) => {
                        item
                            .setTitle(t("menu_flashcard", this.settings.language))
                            .setIcon("layers")
                            .onClick(() => {
                                const template = "```flashcard\n[\n  {\n    \"question\": \"\",\n    \"answer\": \"\"\n  }\n]\n```";
                                editor.replaceSelection(template);
                            });
                    });

                    subMenu.addItem((item) => {
                        item
                            .setTitle(t("menu_flashcard_json", this.settings.language))
                            .setIcon("file-json")
                            .onClick(() => {
                                const template = "```flashcard\n{\n  \"file\": \"path/to/your/file.json\"\n}\n```";
                                editor.replaceSelection(template);
                            });
                    });
                });
            })
        );
    }

    async renderLauncher(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext, type: "flashcard" | "quizz") {
        try {
            const data = JSON.parse(source);
            let items: any[] = [];

            if (data.file) {
                const file = this.app.vault.getAbstractFileByPath(data.file);
                if (file instanceof TFile) {
                    items = JSON.parse(await this.app.vault.read(file));
                }
            } else {
                items = Array.isArray(data) ? data : (data.items || []);
            }

            const deckId = data.id || data.file || `${ctx.sourcePath}#${hashCode(source)}`;
            const child = new LauncherChild(el, this, deckId, type, items);
            ctx.addChild(child);

        } catch (e) {
            el.createEl("pre", { text: t("json_error", this.settings.language) + e.message });
        }
    }

    refreshLaunchers(deckId: string) {
        const launchers = this.activeLaunchers.get(deckId);
        if (launchers) {
            launchers.forEach(l => l.refresh());
        }
    }

    async loadSettings() { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); }
    async saveSettings() { await this.saveData(this.settings); }
}

// --- RENDER CHILD POUR LES LAUNCHERS ---

class LauncherChild extends MarkdownRenderChild {
    badgeEl: HTMLElement;

    constructor(
        containerEl: HTMLElement,
        public plugin: JsonFlashcardPlugin,
        public deckId: string,
        public type: "flashcard" | "quizz",
        public items: any[]
    ) {
        super(containerEl);
    }

    onload() {
        let launchers = this.plugin.activeLaunchers.get(this.deckId);
        if (!launchers) {
            launchers = new Set();
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
}

// --- LOGIQUE COMMUNE ---

abstract class BaseModal extends Modal {
    currentIndex: number = 0;
    correctCount: number = 0;
    viewedCount: number = 0;

    // UI Progress
    progressFillEl: HTMLElement;
    progressTextEl: HTMLElement;

    touchStartX: number = 0;
    touchStartY: number = 0;
    readonly swipeThreshold = 50;

    constructor(app: App, public deckId: string, public plugin: JsonFlashcardPlugin) {
        super(app);
    }

    onOpen() {
        this.contentEl.empty();
        this.contentEl.addClass("fc-modal-full");

        // Header avec Barre de Progression
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

    updateProgressUI(total: number) {
        const current = this.currentIndex + 1;
        const percent = (current / total) * 100;
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

    abstract handleSwipe(direction: "left" | "right" | "up" | "down"): void;
    abstract renderGame(contentEl: HTMLElement): void;

    async updateScore(isCorrect: boolean) {
        this.viewedCount++;
        if (isCorrect) this.correctCount++;
        this.plugin.settings.lastScores[this.deckId] = `${this.correctCount}/${this.viewedCount}`;
    }

    onClose() {
        this.plugin.saveSettings();
        this.plugin.refreshLaunchers(this.deckId);
    }
}

// --- MODALE QUIZZ (QCM) ---

class QuizModal extends BaseModal {
    questions: QuizQuestion[];
    gameContainer: HTMLElement;
    actionBtn: HTMLButtonElement;
    optionsList: HTMLElement;
    selectedOptions: Set<number> = new Set();
    isAnswered: boolean = false;

    constructor(app: App, questions: QuizQuestion[], deckId: string, plugin: JsonFlashcardPlugin) {
        super(app, deckId, plugin);
        this.questions = [...questions].sort(() => Math.random() - 0.5);
    }

    renderGame(contentEl: HTMLElement) {
        this.gameContainer = contentEl.createDiv({ cls: "fc-game-container" });
        this.displayQuestion();
    }

    handleSwipe(direction: "left" | "right" | "up" | "down") {
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
        const correctIndices = q.options.map((o, i) => o.correct ? i : null).filter(i => i !== null);
        const isCorrect = correctIndices.length === this.selectedOptions.size &&
            correctIndices.every(i => this.selectedOptions.has(i as number));

        await this.updateScore(isCorrect);

        const shuffledOptions = (this.optionsList as any)._shuffledOptions;
        Array.from(this.optionsList.children).forEach((child: HTMLElement, idx) => {
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
        const shuffledOptions = [...q.options].map((opt, index) => ({ ...opt, originalIndex: index }))
            .sort(() => Math.random() - 0.5);

        this.gameContainer.createEl("h2", { text: q.question, cls: "fc-question-text" });

        this.optionsList = this.gameContainer.createDiv({ cls: "fc-options-list" });
        (this.optionsList as any)._shuffledOptions = shuffledOptions;

        shuffledOptions.forEach((opt) => {
            const btn = this.optionsList.createEl("button", { text: opt.text, cls: "fc-option-btn" });
            btn.onclick = () => {
                if (this.isAnswered) return;
                btn.toggleClass("is-selected", !btn.hasClass("is-selected"));
                if (btn.hasClass("is-selected")) this.selectedOptions.add(opt.originalIndex);
                else this.selectedOptions.delete(opt.originalIndex);
            };
        });

        this.actionBtn = this.gameContainer.createEl("button", { text: t("validate", this.plugin.settings.language), cls: "fc-btn-validate mod-cta" }) as HTMLButtonElement;
        this.actionBtn.onclick = () => this.handleAction();
    }

    showFinalScore() {
        this.gameContainer.empty();
        this.gameContainer.createEl("h2", { text: t("completed", this.plugin.settings.language) });
        this.gameContainer.createEl("div", { text: `${t("final_score", this.plugin.settings.language)}${this.correctCount}/${this.viewedCount}`, cls: "fc-final-score" });
    }
}

// --- MODALE FLASHCARDS ---

class FlashcardModal extends BaseModal {
    cards: Flashcard[];
    cardContainer: HTMLElement;
    cardFront: HTMLElement;
    cardBack: HTMLElement;
    scoreGroup: HTMLElement;
    isFlipped: boolean = false;
    hasBeenFlipped: boolean = false;
    isAnimating: boolean = false;

    constructor(app: App, cards: Flashcard[], deckId: string, plugin: JsonFlashcardPlugin) {
        super(app, deckId, plugin);
        this.cards = [...cards].sort(() => Math.random() - 0.5);
    }

    renderGame(contentEl: HTMLElement) {
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

    handleSwipe(direction: "left" | "right" | "up" | "down") {
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

    async record(correct: boolean) {
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

    navigate(direction: number, animationClass: string) {
        const nextIndex = this.currentIndex + direction;
        if (nextIndex < 0 || nextIndex >= this.cards.length) return;
        this.isAnimating = true;
        this.cardContainer.addClass(animationClass);
        setTimeout(() => {
            this.currentIndex = nextIndex;
            this.display();
        }, 400);
    }
}

class JsonFlashcardSettingTab extends PluginSettingTab {
    plugin: JsonFlashcardPlugin;

    constructor(app: App, plugin: JsonFlashcardPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName(t("settings_language", this.plugin.settings.language))
            .setDesc(t("settings_language_desc", this.plugin.settings.language))
            .addDropdown(dropdown => dropdown
                .addOption('en', 'English')
                .addOption('fr', 'Français')
                .addOption('de', 'Deutsch')
                .addOption('es', 'Español')
                .addOption('zh', '简体中文')
                .addOption('ja', '日本語')
                .addOption('pt', 'Português')
                .setValue(this.plugin.settings.language)
                .onChange(async (value: Language) => {
                    this.plugin.settings.language = value;
                    await this.plugin.saveSettings();
                    this.display();
                })
            );
    }
}