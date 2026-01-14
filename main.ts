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
    language: Language;
    learningMode: 'random' | 'srs';
}

interface ProgressData {
    lastScores: Record<string, string>;
    srsData: Record<string, SRSItem>;
}

const DEFAULT_SETTINGS: PluginSettings = {
    language: 'en',
    learningMode: 'random'
};

const DEFAULT_PROGRESS: ProgressData = {
    lastScores: {},
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
    progress: ProgressData;
    activeLaunchers: Map<string, Set<LauncherChild>> = new Map();

    async onload() {
        await this.loadSettings();
        await this.loadProgress();

        this.addSettingTab(new JsonFlashcardSettingTab(this.app, this));

        this.registerMarkdownCodeBlockProcessor("flashcard", async (source, el, ctx) => {
            this.renderLauncher(source, el, ctx, "flashcard");
        });

        this.registerMarkdownCodeBlockProcessor("quizz", async (source, el, ctx) => {
            this.renderLauncher(source, el, ctx, "quizz");
        });

        // --- CONTEXT MENU ---
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

        // --- RIBBON ICON ---
        this.addRibbonIcon("library", t("library_title", this.settings.language), () => {
            new LibraryModal(this.app, this).open();
        });

        // --- COMMANDS ---
        this.addCommand({
            id: 'open-library',
            name: t("library_title", this.settings.language),
            callback: () => new LibraryModal(this.app, this).open()
        });

        this.addCommand({
            id: 'launch-all-flashcards',
            name: t("ribbon_all_flashcards", this.settings.language) + " (Vault)",
            callback: () => this.launchAllFlashcards()
        });

        this.addCommand({
            id: 'launch-all-quizzes',
            name: t("launch_quiz", this.settings.language) + " (Vault)",
            callback: () => this.launchAllQuizzes()
        });

        this.addCommand({
            id: 'launch-flashcards-folder',
            name: t("launch_flashcards", this.settings.language) + " (Folder)",
            callback: () => new FolderFuzzySuggestModal(this.app, this, "flashcard").open()
        });

        this.addCommand({
            id: 'launch-quizzes-folder',
            name: t("launch_quiz", this.settings.language) + " (Folder)",
            callback: () => new FolderFuzzySuggestModal(this.app, this, "quizz").open()
        });
    }

    async scanVault() {
        const files = this.app.vault.getMarkdownFiles();
        const results: { file: TFile, flashcards: number, quizzes: number }[] = [];

        for (const file of files) {
            try {
                const content = await this.app.vault.read(file);
                const fMatches = content.match(/```flashcard/g);
                const qMatches = content.match(/```quizz/g);

                if (fMatches || qMatches) {
                    results.push({
                        file,
                        flashcards: fMatches ? fMatches.length : 0,
                        quizzes: qMatches ? qMatches.length : 0
                    });
                }
            } catch (e) {
                console.warn(`[Flashcard Plugin] Failed to read file ${file.path}:`, e);
            }
        }
        return results;
    }

    async loadItemsFromFile(file: TFile, type: "flashcard" | "quizz"): Promise<any[]> {
        let content = "";
        try {
            content = await this.app.vault.read(file);
        } catch (e) {
            console.error(`[Flashcard Plugin] Error reading file ${file.path}:`, e);
            return [];
        }
        const regex = type === "flashcard" ? /```flashcard\n([\s\S]*?)\n```/g : /```quizz\n([\s\S]*?)\n```/g;
        const items: any[] = [];
        let match;

        while ((match = regex.exec(content)) !== null) {
            try {
                const source = match[1];
                const data = JSON.parse(source);
                if (data.file) {
                    const jsonFile = this.app.vault.getAbstractFileByPath(data.file);
                    if (jsonFile instanceof TFile) {
                        try {
                            items.push(...JSON.parse(await this.app.vault.read(jsonFile)));
                        } catch (e) {
                            console.error(`[Flashcard Plugin] Error reading JSON file ${data.file}:`, e);
                        }
                    }
                } else {
                    items.push(...(Array.isArray(data) ? data : (data.items || [])));
                }
            } catch (e) {
                console.error(`Error parsing ${type} in ${file.path}:`, e);
            }
        }
        return items;
    }

    async launchAllFlashcards(folderPaths?: string[]) {
        const flashcards: Flashcard[] = [];
        const files = this.app.vault.getMarkdownFiles();

        for (const file of files) {
            if (folderPaths && folderPaths.length > 0) {
                const isInSelectedFolder = folderPaths.some(path => file.path.startsWith(path));
                if (!isInSelectedFolder) continue;
            }
            flashcards.push(...await this.loadItemsFromFile(file, "flashcard"));
        }

        if (flashcards.length > 0) {
            const deckId = folderPaths && folderPaths.length > 0 ? `all-flashcards:${folderPaths.sort().join(",")}` : "all-flashcards";
            new FlashcardModal(this.app, flashcards, deckId, this).open();
        } else {
            new Notice(t("none", this.settings.language));
        }
    }

    async launchAllQuizzes(folderPaths?: string[]) {
        const quizzes: QuizQuestion[] = [];
        const files = this.app.vault.getMarkdownFiles();

        for (const file of files) {
            if (folderPaths && folderPaths.length > 0) {
                const isInSelectedFolder = folderPaths.some(path => file.path.startsWith(path));
                if (!isInSelectedFolder) continue;
            }
            quizzes.push(...await this.loadItemsFromFile(file, "quizz"));
        }

        if (quizzes.length > 0) {
            const deckId = folderPaths && folderPaths.length > 0 ? `all-quizzes:${folderPaths.sort().join(",")}` : "all-quizzes";
            new QuizModal(this.app, quizzes, deckId, this).open();
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
                    try {
                        items = JSON.parse(await this.app.vault.read(file));
                    } catch (e) {
                        console.error(`[Flashcard Plugin] Error reading JSON source ${data.file}:`, e);
                        items = [];
                    }
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

    async loadSettings() {
        const data = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, data);

        // Migration logic: if data.json contains progress, move it to progress.json
        if (data && (data.lastScores || data.srsData)) {
            this.progress = {
                lastScores: data.lastScores || {},
                srsData: data.srsData || {}
            };
            await this.saveProgress();

            // Remove progress from settings and save data.json
            delete (this.settings as any).lastScores;
            delete (this.settings as any).srsData;
            await this.saveSettings();
        }
    }

    async saveSettings() { await this.saveData(this.settings); }

    async loadProgress() {
        const path = `${this.manifest.dir}/progress.json`;
        if (await this.app.vault.adapter.exists(path)) {
            const content = await this.app.vault.adapter.read(path);
            try {
                this.progress = Object.assign({}, DEFAULT_PROGRESS, JSON.parse(content));
            } catch (e) {
                console.error("Failed to parse progress.json:", e);
                this.progress = Object.assign({}, DEFAULT_PROGRESS);
            }
        } else {
            this.progress = Object.assign({}, DEFAULT_PROGRESS);
        }
    }

    async saveProgress() {
        const path = `${this.manifest.dir}/progress.json`;
        await this.app.vault.adapter.write(path, JSON.stringify(this.progress, null, 2));
    }

    getSRSStats() {
        const now = Date.now();
        const items = Object.values(this.progress.srsData);
        const total = items.length;
        const due = items.filter(item => item.nextReview <= now).length;
        const learned = items.filter(item => item.reps > 0).length;
        return { total, due, learned };
    }
}

// --- LIBRARY MODAL ---

class LibraryModal extends Modal {
    activeTab: "flashcard" | "quizz" | "folder" = "flashcard";

    constructor(app: App, public plugin: JsonFlashcardPlugin) {
        super(app);
    }

    async onOpen() {
        const { contentEl } = this;
        this.modalEl.addClass("fc-modal-full");
        contentEl.empty();

        contentEl.createEl("h2", { text: t("library_title", this.plugin.settings.language) });

        const container = contentEl.createDiv({ cls: "fc-library-container" });

        // Tabs
        const tabs = container.createDiv({ cls: "fc-library-tabs" });
        const tabF = tabs.createDiv({ text: t("library_tab_flashcards", this.plugin.settings.language), cls: "fc-library-tab" });
        const tabQ = tabs.createDiv({ text: t("library_tab_quizzes", this.plugin.settings.language), cls: "fc-library-tab" });
        const tabD = tabs.createDiv({ text: t("library_tab_folders", this.plugin.settings.language), cls: "fc-library-tab" });

        const header = container.createDiv({ cls: "fc-library-header" });
        const searchInput = header.createEl("input", {
            type: "text",
            placeholder: t("library_search_placeholder", this.plugin.settings.language),
            cls: "fc-library-search"
        });

        const launchAllBtn = header.createEl("button", {
            text: t("library_launch_all", this.plugin.settings.language),
            cls: "mod-cta"
        });

        const listContainer = container.createDiv({ cls: "fc-library-list" });

        const refreshList = async (filter = "") => {
            listContainer.empty();
            header.style.display = this.activeTab === "folder" ? "none" : "flex";

            if (this.activeTab === "folder") {
                this.renderFolderTab(listContainer);
                return;
            }

            const results = await this.plugin.scanVault();
            const filtered = results.filter(r => {
                const matchesFilter = r.file.path.toLowerCase().includes(filter.toLowerCase());
                const hasType = this.activeTab === "flashcard" ? r.flashcards > 0 : r.quizzes > 0;
                return matchesFilter && hasType;
            });

            if (filtered.length === 0) {
                listContainer.createEl("div", { text: t("library_no_items", this.plugin.settings.language), cls: "fc-library-no-items" });
                return;
            }

            filtered.forEach(res => {
                const item = listContainer.createDiv({ cls: "fc-library-item" });
                const info = item.createDiv({ cls: "fc-library-item-info" });
                info.createDiv({ text: res.file.basename, cls: "fc-library-item-name" });

                const count = this.activeTab === "flashcard" ? res.flashcards : res.quizzes;
                info.createDiv({
                    text: `${count} ${this.activeTab === "flashcard" ? "flashcards" : "quizzes"}`,
                    cls: "fc-library-item-meta"
                });

                const actions = item.createDiv({ cls: "fc-library-item-actions" });
                const btn = actions.createEl("button", { text: "Launch", cls: "mod-cta" });
                btn.onclick = async () => {
                    const items = await this.plugin.loadItemsFromFile(res.file, this.activeTab as any);
                    if (this.activeTab === "flashcard") new FlashcardModal(this.app, items, res.file.path, this.plugin).open();
                    else new QuizModal(this.app, items, res.file.path, this.plugin).open();
                };
            });
        };

        const switchTab = (tab: "flashcard" | "quizz" | "folder") => {
            this.activeTab = tab;
            tabF.toggleClass("is-active", tab === "flashcard");
            tabQ.toggleClass("is-active", tab === "quizz");
            tabD.toggleClass("is-active", tab === "folder");
            refreshList(searchInput.value);
        };

        tabF.onclick = () => switchTab("flashcard");
        tabQ.onclick = () => switchTab("quizz");
        tabD.onclick = () => switchTab("folder");

        searchInput.oninput = () => refreshList(searchInput.value);

        launchAllBtn.onclick = () => {
            if (this.activeTab === "flashcard") this.plugin.launchAllFlashcards();
            else if (this.activeTab === "quizz") this.plugin.launchAllQuizzes();
        };

        switchTab("flashcard");
    }

    renderFolderTab(container: HTMLElement) {
        const folderContainer = container.createDiv({ cls: "fc-folder-selection-container" });

        // --- ALL VAULT ---
        const allVaultItem = folderContainer.createDiv({ cls: "fc-library-item" });
        const allVaultInfo = allVaultItem.createDiv({ cls: "fc-library-item-info" });
        allVaultInfo.createDiv({ text: t("all_vault", this.plugin.settings.language), cls: "fc-library-item-name" });

        const allVaultActions = allVaultItem.createDiv({ cls: "fc-library-item-actions" });
        const allVaultF = allVaultActions.createEl("button", { text: "Flashcards", cls: "mod-cta" });
        allVaultF.onclick = () => {
            this.plugin.launchAllFlashcards();
            this.close();
        };
        const allVaultQ = allVaultActions.createEl("button", { text: "Quizzes", cls: "mod-cta" });
        allVaultQ.onclick = () => {
            this.plugin.launchAllQuizzes();
            this.close();
        };

        // --- SELECT SPECIFIC ---
        const specificItem = folderContainer.createDiv({ cls: "fc-library-item" });
        const specificInfo = specificItem.createDiv({ cls: "fc-library-item-info" });
        specificInfo.createDiv({ text: t("select_specific_folder", this.plugin.settings.language), cls: "fc-library-item-name" });

        const specificActions = specificItem.createDiv({ cls: "fc-library-item-actions" });
        const specificF = specificActions.createEl("button", { text: "Flashcards", cls: "mod-cta" });
        specificF.onclick = () => {
            new FolderFuzzySuggestModal(this.app, this.plugin, "flashcard").open();
            this.close();
        };
        const specificQ = specificActions.createEl("button", { text: "Quizzes", cls: "mod-cta" });
        specificQ.onclick = () => {
            new FolderFuzzySuggestModal(this.app, this.plugin, "quizz").open();
            this.close();
        };

        folderContainer.createEl("hr");
        folderContainer.createEl("h3", { text: t("select_folders", this.plugin.settings.language) });

        const folderList = folderContainer.createDiv({ cls: "fc-folder-list" });
        const rootFolders = this.app.vault.getRoot().children.filter(f => f instanceof TFolder) as TFolder[];

        rootFolders.forEach(folder => {
            const item = folderList.createDiv({ cls: "fc-library-item" });
            const info = item.createDiv({ cls: "fc-library-item-info" });
            info.createDiv({ text: folder.name, cls: "fc-library-item-name" });

            const actions = item.createDiv({ cls: "fc-library-item-actions" });

            const btnF = actions.createEl("button", { text: "Flashcards", cls: "mod-cta" });
            btnF.onclick = () => {
                this.plugin.launchAllFlashcards([folder.path]);
                this.close();
            };

            const btnQ = actions.createEl("button", { text: "Quizzes", cls: "mod-cta" });
            btnQ.onclick = () => {
                this.plugin.launchAllQuizzes([folder.path]);
                this.close();
            };
        });
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

        try {
            const content = await this.plugin.app.vault.read(file);
            const lines = content.split("\n");

            const blockLines = lines.slice(section.lineStart + 1, section.lineEnd);
            const blockSource = blockLines.join("\n");

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
        const lastScore = this.plugin.progress.lastScores[this.deckId];
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
        this.previousScore = this.plugin.progress.lastScores[this.deckId] || t("none", this.plugin.settings.language);
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
        this.plugin.progress.lastScores[this.deckId] = `${this.correctCount}/${this.viewedCount}`;
    }

    onClose() {
        this.plugin.saveSettings();
        this.plugin.saveProgress();
        this.plugin.refreshLaunchers(this.deckId);
        new Notice(`${t("final_score", this.plugin.settings.language)}${this.correctCount}/${this.viewedCount} (${t("prev_score", this.plugin.settings.language)}${this.previousScore})`);
    }

    filterDueItems<T extends { question: string }>(items: T[]): T[] {
        if (this.plugin.settings.learningMode === 'random') return [...items].sort(() => Math.random() - 0.5);

        const now = Date.now();
        return items.filter(item => {
            const id = hashCode(item.question);
            const data = this.plugin.progress.srsData[id];
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
            this.plugin.progress.srsData[id] = updateSRS(this.plugin.progress.srsData[id], isCorrect ? 4 : 0);
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
        // Hide answer initially to prevent seeing it during flip animation
        this.cardBack.style.visibility = "hidden";
        this.cardBack.setText(card.answer);
    }

    flip() {
        if (this.isAnimating) return;
        this.isFlipped = !this.isFlipped;
        this.cardContainer.toggleClass("is-flipped", this.isFlipped);
        if (this.isFlipped && !this.hasBeenFlipped) {
            this.hasBeenFlipped = true;
            this.scoreGroup.removeClass("is-hidden");
            // Reveal answer after flip animation is halfway done (when card is perpendicular)
            setTimeout(() => {
                this.cardBack.style.visibility = "visible";
            }, 300); // 300ms = halfway through 0.6s flip animation
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
        this.plugin.progress.srsData[id] = updateSRS(this.plugin.progress.srsData[id], quality);

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
    constructor(app: App, public plugin: JsonFlashcardPlugin, public type: "flashcard" | "quizz") {
        super(app);
    }

    getItems(): TFolder[] {
        return this.app.vault.getAllLoadedFiles().filter(f => f instanceof TFolder) as TFolder[];
    }

    getItemText(item: TFolder): string {
        return item.path;
    }

    onChooseItem(item: TFolder, evt: MouseEvent | KeyboardEvent): void {
        if (this.type === "flashcard") this.plugin.launchAllFlashcards([item.path]);
        else this.plugin.launchAllQuizzes([item.path]);
    }
}

class FileFuzzySuggestModal extends FuzzySuggestModal<TFile> {
    constructor(app: App, public plugin: JsonFlashcardPlugin, public type: "flashcard" | "quizz") {
        super(app);
    }

    getItems(): TFile[] {
        return this.app.vault.getMarkdownFiles();
    }

    getItemText(item: TFile): string {
        return item.path;
    }

    onChooseItem(item: TFile, evt: MouseEvent | KeyboardEvent): void {
        if (this.type === "flashcard") this.plugin.launchAllFlashcards([item.path]);
        else this.plugin.launchAllQuizzes([item.path]);
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
                        this.plugin.progress.lastScores = {};
                        await this.plugin.saveProgress();
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
                        this.plugin.progress.srsData = {};
                        await this.plugin.saveProgress();
                        new Notice("SRS data reset!");
                        this.display();
                    }
                })
            );
    }
}