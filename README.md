# Flash&Quizz 🧠

**Flash&Quizz** is a powerful and aesthetic Obsidian plugin that transforms your JSON data into interactive learning tools. Whether you're using inline JSON or external files, you can study with beautiful **3D Flashcards** or test your knowledge with automated **Quizzes**.

---

## ✨ Features

*   **Dual Learning Modes**:
    *   **3D Flashcards**: Immersive front/back cards with smooth 3D flip animations and self-assessment.
    *   **Interactive Quizzes**: Multiple-choice questions (MCQ) with automated scoring and instant feedback.
    *   **Global Session**: Launch a combined session containing all flashcards from your entire vault with a single click from the sidebar.
*   **Premium UI/UX**:
    *   **Modern Design**: Sleek interface with glassmorphism, vibrant colors, and smooth transitions.
    *   **Gestures Support**: Swipe left/right to grade flashcards or navigate through questions.
    *   **Progress Tracking**: Visual progress bars, score badges, and **end-of-session score comparison** to monitor your learning journey.
*   **Session Summary**: View your current performance compared to your previous score upon completion or early exit.
*   **Data Flexibility**:
    *   **Inline JSON**: Define your decks directly inside your markdown notes.
    *   **External Files**: Reference `.json` files stored anywhere in your vault.
*   **Banner Image Support**:
    *   **Custom Banners**: Add beautiful background images to your launchers using the `img` property.
    *   **Drag & Drop**: Simply drag an image file or an `obsidian://` link onto a launcher to update its banner instantly.
    *   **Smart Resolution**: Supports web URLs, internal Obsidian links (`[[image.png]]`), and `obsidian://` URIs.
*   **Multilingual**: Full support for **English**, **French**, **German**, **Spanish**, **Chinese**, **Japanese**, and **Portuguese**, configurable in the settings.
*   **Smart Shuffling**: Questions and options are randomized every session to ensure true mastery.

---

## 🚀 How to Use
### 🖱️Context Menu (Fast Insert)
To quickly add cards or quizzes, right-click in the editor and use the Insert Quiz/Flashcard sub-menu to choose between inline templates or JSON file references.

### 1. Flashcards Mode (`flashcard`)

Perfect for active recall. Each card requires a `question` and an `answer`.

**Inline Data Example:**

````markdown
```flashcard
[
  { "question": "What is the powerhouse of the cell?", "answer": "Mitochondria" },
  { "question": "Who developed the theory of relativity?", "answer": "Albert Einstein" }
]
```
````

**External File Example:**

````markdown
```flashcard
{ "file": "Resources/Science_Deck.json" }
```
````

### 2. Quizz Mode (`quizz`)

Ideal for testing specific knowledge. Each question includes an array of `options`, each with a `text` and a `correct` boolean.

**Example:**

````markdown
```quizz
[
  {
    "question": "Which planets are gas giants?",
    "options": [
      { "text": "Jupiter", "correct": true },
      { "text": "Mars", "correct": false },
      { "text": "Saturn", "correct": true },
      { "text": "Venus", "correct": false }
    ]
  }
]
```
````

**External File Example:**

````markdown
```quizz
{ "file": "Resources/Science_Deck.json" }
```
````

### 3. Global Session (Ribbon Icon)

For a comprehensive review, you can launch a session that aggregates **all flashcards** from every `flashcard` code block in your vault.

*   **How to launch**: Click the **Layers icon** (`layers`) in the Obsidian left ribbon (sidebar).
*   **Folder Selection**: Upon clicking, a modal will appear allowing you to choose between:
    *   **All Vault**: Scans every markdown file in your vault.
    *   **Specific Folder**: Scans only the markdown files within a selected root folder.
*   **Smart Score Saving**: Scores for global sessions are saved independently based on your selection. For example, a session for your "Biology" folder will have its own "Last Score" separate from an "All Vault" session.

### 4. Session Completion & Scoring

At the end of every session (whether you finish all cards or exit early), **Flash&Quizz** provides a detailed summary:
*   **Final Score Screen**: For both Flashcards and Quizzes, a dedicated screen displays your final score (e.g., `8/10`).
*   **Score Comparison**: Your current score is displayed alongside your **previous score** for that specific deck or folder context, allowing you to track your improvement instantly.
*   **Summary Notice**: Upon closing the session modal, a quick notification appears in the corner of Obsidian with your session summary.

### 🖼️ 5. Banner Images & Drag-and-Drop
You can personalize each launcher with a background image to make your notes even more aesthetic.

*   **Adding a Banner**: Add an `img` property to your JSON block:
    ````markdown
    ```flashcard
    {
      "img": "path/to/image.jpg",
      "items": [ ... ]
    }
    ```
    ````
*   **Drag-and-Drop**: You can update the banner of any existing launcher by dragging an image from your file explorer or a link from your browser directly onto the launcher container.
*   **Persistence**: When you drop an image, the plugin automatically updates the source code of your note to save the new image path.


---

## 🎮 Gestures & Interaction

The plugin is optimized for both desktop and mobile (touch) use.

### 🗂️ Flashcards Mode
*   **Tap**: Flip the card to reveal the answer.
*   **Swipe Right**: Mark as **Correct**.
*   **Swipe Left**: Mark as **Incorrect**.
*   **Swipe Up**: Go to the **Next** card.
*   **Swipe Down**: Go to the **Previous** card.

### 📝 Quizz Mode
*   **Tap Options**: Select one or multiple answers.
*   **Swipe Left/Right**: **Validate** your selection or go to the **Next** question (marked as failed if incorrect).

---

## 🎲 Randomization
To ensure effective learning, **Flash&Quizz** automatically shuffles your decks:
*   **Flashcards**: The order of cards is randomized every time you start.
*   **Quizzes**: Both the order of questions and the order of options within each question are randomized.

---

## ⚙️ Settings

You can customize the plugin behavior in the **Flash&Quizz** settings tab:
*   **Language**: Choose between English, Français, Deutsch, Español, 中文, 日本語, and Português.
*   **Score History**: View and manage your last scores for each deck.

---

## 🛠️ Installation & Development

### For Users
1.  **Create Plugin Folder**: Go to your vault's `.obsidian/plugins/` directory and create a folder named `obsidian-flash-quizz`.
2.  **Add Files**: Place `main.js`, `manifest.json`, and `styles.css` inside that folder.
3.  **Enable**: Open Obsidian, go to **Settings > Community Plugins**, and toggle on **Flash&Quizz**.

### For Developers
If you want to modify the plugin, you'll need the following source files:
*   `main.ts`: The main plugin logic.
*   `i18n.ts`: The localization and translation system.
*   `styles.css`: The UI styling and animations.
*   `manifest.json`: Plugin metadata.
*   `package.json` & `tsconfig.json`: Build configurations.

You can rebuild the plugin using the following command:

```bash
npx esbuild main.ts --bundle --external:obsidian --outfile=main.js --format=cjs
```

Alternatively, if you have the full environment set up:
```bash
npm install
npm run build
```

---

## 📝 Technical Details

*   **Plugin ID**: `obsidian-flash-quizz`
*   **Author**: Infinition
*   **Storage**: Scores are persisted in `data.json` under the `lastScores` record.
*   **Localization**: Powered by `i18n.ts` (supports 7 languages)..
*   **Code Processors**: Registers `flashcard` and `quizz` as markdown code block processors.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
