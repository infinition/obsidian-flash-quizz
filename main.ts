import { App, Modal, Plugin, TFile, TFolder, setIcon, MarkdownRenderChild, MarkdownPostProcessorContext, PluginSettingTab, Setting, Editor, Menu, Notice, FuzzySuggestModal } from 'obsidian';
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

interface SRSItem {
    nextReview: number; // timestamp
    interval: number; // days
    ease: number; // ease factor
    reps: number; // number of successful repetitions
}

interface PluginSettings {
    lastScores: Record<string, string>;
    language: Language;
    learningMode: 'random' | 'srs';
    srsData: Record<string, SRSItem>;
}

const DEFAULT_SETTINGS: PluginSettings = {
    lastScores: {},
    language: 'en',
    learningMode: 'random',
    srsData: {}
};

// --- SRS LOGIC (SM-2 Algorithm) ---

function updateSRS(item: SRSItem | undefined, quality: number): SRSItem {
    let { interval, ease, reps } = item || { interval: 0, ease: 2.5, reps: 0 };

    if (quality >= 3) {
        if (reps === 0) interval = 1;
        else if (reps === 1) interval = 6;
        else interval = Math.round(interval * ease);
        reps++;
    } else {
        reps = 0;
        interval = 1;
    }

    ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ease < 1.3) ease = 1.3;

    const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

    return { nextReview, interval, ease, reps };
}

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

        // --- AJOUT DE L'ICÔNE DANS LA BARRE LATERALE ---
        this.addRibbonIcon("layers", t("ribbon_all_flashcards", this.settings.language), () => {
            new FolderSelectionModal(this.app, this).open();
        });
    }

    async launchAllFlashcards(folderPaths?: string[]) {
        const flashcards: Flashcard[] = [];
        const files = this.app.vault.getMarkdownFiles();

        for (const file of files) {
            if (folderPaths && folderPaths.length > 0) {
                const isInSelectedFolder = folderPaths.some(path => file.path.startsWith(path));
                if (!isInSelectedFolder) continue;
            }

            const content = await this.app.vault.read(file);
            const regex = /```flashcard\n([\s\S]*?)\n```/g;
            let match;

            while ((match = regex.exec(content)) !== null) {
                try {
                    const source = match[1];
                    const data = JSON.parse(source);
                    let items: Flashcard[] = [];

                    if (data.file) {
                        const jsonFile = this.app.vault.getAbstractFileByPath(data.file);
                        if (jsonFile instanceof TFile) {
                            items = JSON.parse(await this.app.vault.read(jsonFile));
                        }
                    } else {
                        items = Array.isArray(data) ? data : (data.items || []);
                    }

                    flashcards.push(...items);
                } catch (e) {
                    console.error(`Error parsing flashcards in ${file.path}:`, e);
                }
            }
        }

        if (flashcards.length > 0) {
            const deckId = folderPaths && folderPaths.length > 0 ? `all-flashcards:${folderPaths.sort().join(",")}` : "all-flashcards";
            new FlashcardModal(this.plugin.app, flashcards, deckId, this).open();
        } else {
            new Notice(t("none", this.settings.language));
        }
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
            const child = new LauncherChild(el, this, deckId, type, items, data.img, ctx);
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

    getSRSStats() {
        const now = Date.now();
        const items = Object.values(this.settings.srsData);
        const total = items.length;
        const due = items.filter(item => item.nextReview <= now).length;
        const learned = items.filter(item => item.reps > 0).length;
        return { total, due, learned };
    }
}

// --- RENDER CHILD POUR LES LAUNCHERS ---

class LauncherChild extends MarkdownRenderChild {
    badgeEl: HTMLElement;

    constructor(
        containerEl: HTMLElement,
        public plugin: JsonFlashcardPlugin,
        public deckId: string,
        public type: "flashcard" | "quizz",
        public items: any[],
        public imgUrl?: string,
        public ctx?: MarkdownPostProcessorContext
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

        // Drag & Drop
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

    resolveImageUrl(url: string): string {
        if (url.startsWith("http")) return url;

        let path = url;
        if (url.startsWith("obsidian://")) {
            try {
                // Extract file path from obsidian://open?vault=...&file=...
                const match = url.match(/[?&]file=([^&]+)/);
                if (match) path = decodeURIComponent(match[1]);
            } catch (e) {
                console.error("Failed to parse obsidian URL:", e);
            }
        }

        // Clean up [[ ]] if present
        path = path.replace(/^\[\[/, "").replace(/\]\]$/, "").split("|")[0].trim();

        // Try to find the file via linkpath
        const file = this.plugin.app.metadataCache.getFirstLinkpathDest(path, "");
        if (file instanceof TFile) {
            return this.plugin.app.vault.adapter.getResourcePath(file.path);
        }

        // Try as raw path
        const abstractFile = this.plugin.app.vault.getAbstractFileByPath(path);
        if (abstractFile instanceof TFile) {
            return this.plugin.app.vault.adapter.getResourcePath(abstractFile.path);
        }

        return url;
    }

    async updateSource(newImgUrl: string) {
        if (!this.ctx) return;
        const file = this.plugin.app.vault.getAbstractFileByPath(this.ctx.sourcePath);
        if (!(file instanceof TFile)) return;

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
            new Notice("Banner updated!");
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
}

// --- LOGIQUE COMMUNE ---

abstract class BaseModal extends Modal {
    currentIndex: number = 0;
    correctCount: number = 0;
    viewedCount: number = 0;
    previousScore: string;

    progressFillEl: HTMLElement;
    progressTextEl: HTMLElement;

    touchStartX: number = 0;
    touchStartY: number = 0;
    readonly swipeThreshold = 50;

    constructor(app: App, public deckId: string, public plugin: JsonFlashcardPlugin) {
        super(app);
        this.previousScore = this.plugin.settings.lastScores[this.deckId] || t("none", this.plugin.settings.language);
    }

    onOpen() {
        this.contentEl.empty();
        this.modalEl.addClass("fc-modal-full");

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

    updateProgressUI(total: number) {
        const current = this.currentIndex + 1;
        const percent = total > 0 ? (current / total) * 100 : 0;
        this.progressFillEl.style.width = `${percent}%`;
        this.progressTextEl.setText(`${total > 0 ? current : 0} / ${total}`);
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
        new Notice(`${t("final_score", this.plugin.settings.language)}${this.correctCount}/${this.viewedCount} (${t("prev_score", this.plugin.settings.language)}${this.previousScore})`);
    }

    filterDueItems<T extends { question: string }>(items: T[]): T[] {
        if (this.plugin.settings.learningMode === 'random') return [...items].sort(() => Math.random() - 0.5);

        const now = Date.now();
        return items.filter(item => {
            const id = hashCode(item.question);
            const data = this.plugin.settings.srsData[id];
            return !data || data.nextReview <= now;
        }).sort(() => Math.random() - 0.5);
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
        this.questions = this.filterDueItems(questions);
    }

    renderGame(contentEl: HTMLElement) {
        this.gameContainer = contentEl.createDiv({ cls: "fc-game-container" });
        if (this.questions.length === 0) {
            this.gameContainer.createEl("h2", { text: t("no_items_due", this.plugin.settings.language) });
            return;
        }
        this.displayQuestion();
    }

    handleSwipe(direction: "left" | "right" | "up" | "down") {
        if (this.questions.length === 0) return;
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

        // Update SRS
        if (this.plugin.settings.learningMode === 'srs') {
            const id = hashCode(q.question);
            this.plugin.settings.srsData[id] = updateSRS(this.plugin.settings.srsData[id], isCorrect ? 4 : 0);
        }

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

        shuffledOptions.forEach((opt, idx) => {
            const btn = this.optionsList.createEl("button", { text: opt.text, cls: "fc-option-btn" });

            // Add staggered animation
            btn.style.opacity = "0";
            btn.style.transform = "translateY(10px)";
            setTimeout(() => {
                btn.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
                btn.style.opacity = "1";
                btn.style.transform = "translateY(0)";
            }, 50 * idx);

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

        const scoreContainer = this.gameContainer.createDiv({ cls: "fc-final-score-container" });
        scoreContainer.createEl("div", { text: `${t("final_score", this.plugin.settings.language)}${this.correctCount}/${this.viewedCount}`, cls: "fc-final-score" });
        scoreContainer.createEl("div", { text: `${t("prev_score", this.plugin.settings.language)}${this.previousScore}`, cls: "fc-prev-score-final" });
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
        this.cards = this.filterDueItems(cards);
    }

    renderGame(contentEl: HTMLElement) {
        const container = contentEl.createDiv({ cls: "fc-game-container" });
        if (this.cards.length === 0) {
            container.createEl("h2", { text: t("no_items_due", this.plugin.settings.language) });
            return;
        }

        this.cardContainer = container.createDiv({ cls: "fc-card-container" });
        const inner = this.cardContainer.createDiv({ cls: "fc-card-inner" });
        this.cardFront = inner.createDiv({ cls: "fc-card-front" });
        this.cardBack = inner.createDiv({ cls: "fc-card-back" });

        this.cardContainer.onclick = () => this.flip();

        this.scoreGroup = container.createDiv({ cls: "fc-score-group is-hidden" });

        if (this.plugin.settings.learningMode === 'srs') {
            const btnAgain = this.scoreGroup.createEl("button", { text: t("srs_again", this.plugin.settings.language), cls: "fc-btn-srs fc-btn-again" });
            const btnHard = this.scoreGroup.createEl("button", { text: t("srs_hard", this.plugin.settings.language), cls: "fc-btn-srs fc-btn-hard" });
            const btnGood = this.scoreGroup.createEl("button", { text: t("srs_good", this.plugin.settings.language), cls: "fc-btn-srs fc-btn-good" });
            const btnEasy = this.scoreGroup.createEl("button", { text: t("srs_easy", this.plugin.settings.language), cls: "fc-btn-srs fc-btn-easy" });

            btnAgain.onclick = () => this.recordSRS(0);
            btnHard.onclick = () => this.recordSRS(3);
            btnGood.onclick = () => this.recordSRS(4);
            btnEasy.onclick = () => this.recordSRS(5);
        } else {
            const btnWrong = this.scoreGroup.createEl("button", { text: t("incorrect", this.plugin.settings.language), cls: "fc-btn-wrong" });
            const btnRight = this.scoreGroup.createEl("button", { text: t("correct", this.plugin.settings.language), cls: "fc-btn-right" });

            btnWrong.onclick = () => this.record(false);
            btnRight.onclick = () => this.record(true);
        }

        this.display();
    }

    handleSwipe(direction: "left" | "right" | "up" | "down") {
        if (this.cards.length === 0 || this.isAnimating) return;
        if (this.plugin.settings.learningMode === 'random') {
            if (direction === "right") this.record(true);
            else if (direction === "left") this.record(false);
        }
        if (direction === "up") this.navigate(1, "swipe-up");
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
                this.showFinalScore();
            }
        }, 400);
    }

    async recordSRS(quality: number) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const card = this.cards[this.currentIndex];
        const id = hashCode(card.question);
        this.plugin.settings.srsData[id] = updateSRS(this.plugin.settings.srsData[id], quality);

        this.cardContainer.addClass(quality >= 3 ? "swipe-right" : "swipe-left");
        await this.updateScore(quality >= 3);

        setTimeout(() => {
            if (this.currentIndex < this.cards.length - 1) {
                this.currentIndex++;
                this.display();
            } else {
                this.showFinalScore();
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
}

// --- MODALE DE SELECTION DE DOSSIER ---

class FolderFuzzySuggestModal extends FuzzySuggestModal<TFolder> {
    constructor(app: App, public plugin: JsonFlashcardPlugin) {
        super(app);
    }

    getItems(): TFolder[] {
        return this.app.vault.getAllLoadedFiles().filter(f => f instanceof TFolder) as TFolder[];
    }

    getItemText(item: TFolder): string {
        return item.path;
    }

    onChooseItem(item: TFolder, evt: MouseEvent | KeyboardEvent): void {
        this.plugin.launchAllFlashcards([item.path]);
    }
}

class FileFuzzySuggestModal extends FuzzySuggestModal<TFile> {
    constructor(app: App, public plugin: JsonFlashcardPlugin) {
        super(app);
    }

    getItems(): TFile[] {
        return this.app.vault.getMarkdownFiles();
    }

    getItemText(item: TFile): string {
        return item.path;
    }

    onChooseItem(item: TFile, evt: MouseEvent | KeyboardEvent): void {
        this.plugin.launchAllFlashcards([item.path]);
    }
}

class FolderSelectionModal extends Modal {
    constructor(app: App, public plugin: JsonFlashcardPlugin) {
        super(app);
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

        const searchFolderBtn = container.createEl("button", {
            text: t("select_specific_folder", this.plugin.settings.language),
            cls: "mod-cta fc-folder-btn",
            style: "margin-top: 10px;"
        });
        searchFolderBtn.onclick = () => {
            new FolderFuzzySuggestModal(this.app, this.plugin).open();
            this.close();
        };

        const searchNoteBtn = container.createEl("button", {
            text: t("select_specific_note", this.plugin.settings.language),
            cls: "mod-cta fc-folder-btn",
            style: "margin-top: 10px;"
        });
        searchNoteBtn.onclick = () => {
            new FileFuzzySuggestModal(this.app, this.plugin).open();
            this.close();
        };

        container.createEl("hr");
        container.createEl("h3", { text: t("select_folders", this.plugin.settings.language) });

        const folderList = container.createDiv({ cls: "fc-folder-list" });
        const rootFolders = this.app.vault.getRoot().children.filter(f => f instanceof TFolder) as TFolder[];

        rootFolders.forEach(folder => {
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

        new Setting(containerEl)
            .setName(t("settings_learning_mode", this.plugin.settings.language))
            .setDesc(t("settings_learning_mode_desc", this.plugin.settings.language))
            .addDropdown(dropdown => dropdown
                .addOption('random', t("mode_random", this.plugin.settings.language))
                .addOption('srs', t("mode_srs", this.plugin.settings.language))
                .setValue(this.plugin.settings.learningMode)
                .onChange(async (value: 'random' | 'srs') => {
                    this.plugin.settings.learningMode = value;
                    await this.plugin.saveSettings();
                    this.display();
                })
            );

        containerEl.createEl("h3", { text: t("settings_stats_title", this.plugin.settings.language) });
        const stats = this.plugin.getSRSStats();

        const statsContainer = containerEl.createDiv({ cls: "fc-settings-stats" });
        statsContainer.createEl("div", { text: `${t("settings_stats_total", this.plugin.settings.language)}${stats.total}` });
        statsContainer.createEl("div", { text: `${t("settings_stats_due", this.plugin.settings.language)}${stats.due}` });
        statsContainer.createEl("div", { text: `${t("settings_stats_learned", this.plugin.settings.language)}${stats.learned}` });

        containerEl.createEl("hr");

        new Setting(containerEl)
            .setName(t("settings_reset_scores", this.plugin.settings.language))
            .setDesc(t("settings_reset_scores_desc", this.plugin.settings.language))
            .addButton(btn => btn
                .setButtonText(t("settings_reset_button", this.plugin.settings.language))
                .setWarning()
                .onClick(async () => {
                    if (confirm(t("settings_reset_confirm", this.plugin.settings.language))) {
                        this.plugin.settings.lastScores = {};
                        await this.plugin.saveSettings();
                        new Notice("Scores reset!");
                        this.display();
                    }
                })
            );

        new Setting(containerEl)
            .setName(t("settings_reset_srs", this.plugin.settings.language))
            .setDesc(t("settings_reset_srs_desc", this.plugin.settings.language))
            .addButton(btn => btn
                .setButtonText(t("settings_reset_button", this.plugin.settings.language))
                .setWarning()
                .onClick(async () => {
                    if (confirm(t("settings_reset_confirm", this.plugin.settings.language))) {
                        this.plugin.settings.srsData = {};
                        await this.plugin.saveSettings();
                        new Notice("SRS data reset!");
                        this.display();
                    }
                })
            );
    }
}