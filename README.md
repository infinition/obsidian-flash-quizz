# Flash&Quizz 🧠

**Flash&Quizz** is a powerful and aesthetic Obsidian plugin that transforms your JSON data into interactive learning tools. Whether you're using inline JSON or external files, you can study with beautiful **3D Flashcards** or test your knowledge with automated **Quizzes**.

Now featuring a full **Spaced Repetition System (SRS)** and **Modern UI Enhancements**!

---

## ✨ Features

*   **Dual Learning Modes**:
    *   **3D Flashcards**: Immersive front/back cards with smooth 3D flip animations and self-assessment.
    *   **Interactive Quizzes**: Multiple-choice questions (MCQ) with automated scoring and instant feedback.
*   **Spaced Repetition System (SRS)**:
    *   **SM-2 Algorithm**: Uses the proven SuperMemo-2 algorithm to schedule your reviews at the perfect time.
    *   **Learning Modes**: Switch between **Random** (shuffle all) and **Spaced Repetition** (only due items) in settings.
    *   **Anki-like Grading**: Rate your recall with **Again**, **Hard**, **Good**, and **Easy** buttons.
    *   **SRS Statistics**: Track your progress with **Total**, **Due**, and **Learned** items directly in the settings.
    *   **Reset Functionality**: Easily clear your SRS data or score history to start fresh.
*   **Global Session**: Launch a combined session containing all flashcards from your entire vault or specific folders.
*   **Premium UI/UX**:
    *   **Full-Width Modals**: Optimized layout that takes up 90% of the screen for better readability.
    *   **Responsive Typography**: Font sizes and spacing automatically adjust to prevent clipping and overlapping.
    *   **Scrolling Support**: Smooth vertical scrolling for long questions, answers, or option lists.
    *   **Staggered Animations**: Dynamic entry animations for quiz options and smooth 3D flips for cards.
    *   **Gestures Support**: Swipe left/right to grade flashcards or navigate through questions.
*   **Multilingual**: Full support for **English**, **French**, **German**, **Spanish**, **Chinese**, **Japanese**, and **Portuguese**.
*   **Data Flexibility**: Supports both inline JSON and external `.json` files.
*   **Banner Image Support**: Personalize launchers with custom images via the `img` property or drag-and-drop.

---

## 🚀 How to Use

### 🖱️ Context Menu (Fast Insert)
Right-click in the editor and use the **Insert Quiz/Flashcard** menu to quickly add templates.

### 1. Flashcards Mode (`flashcard`)
Perfect for active recall. Each card requires a `question` and an `answer`.

```markdown
```flashcard
[
  { "question": "What is the powerhouse of the cell?", "answer": "Mitochondria" },
  { "question": "Who developed the theory of relativity?", "answer": "Albert Einstein" }
]
```
```

### 2. Quizz Mode (`quizz`)
Ideal for testing specific knowledge.

```markdown
```quizz
[
  {
    "question": "Which planets are gas giants?",
    "options": [
      { "text": "Jupiter", "correct": true },
      { "text": "Mars", "correct": false },
      { "text": "Saturn", "correct": true }
    ]
  }
]
```
```

### 3. Spaced Repetition (SRS)
To enable SRS:
1.  Go to **Settings** > **Flash&Quizz**.
2.  Set **Learning Mode** to **Spaced Repetition**.
3.  Launch any deck. The plugin will now:
    *   Only show items that are **due** for review.
    *   Show a "No items due" message if you're all caught up.
    *   Update the next review date based on your performance.

---

## 🎮 Gestures & Interaction

### 🗂️ Flashcards Mode
*   **Tap**: Flip the card.
*   **Random Mode**:
    *   **Swipe Right**: Correct.
    *   **Swipe Left**: Incorrect.
*   **SRS Mode**:
    *   Use the buttons: **Again**, **Hard**, **Good**, **Easy**.
*   **Navigation**:
    *   **Swipe Up**: Next card.
    *   **Swipe Down**: Previous card.

### 📝 Quizz Mode
*   **Tap Options**: Select answers.
*   **Swipe Left/Right**: **Validate** or go to the **Next** question.

---

## ⚙️ Settings

*   **Language**: Choose your preferred UI language.
*   **Learning Mode**:
    *   **Random**: Shuffles all items in the deck.
    *   **Spaced Repetition**: Uses the SM-2 algorithm to filter and schedule items.
*   **SRS Statistics**: View your learning progress (Total, Due, Learned).
*   **Reset Buttons**: Independently reset your **Score History** or **SRS Progression**.

---

## 🛠️ Installation

1.  Create `.obsidian/plugins/obsidian-flash-quizz/`.
2.  Add `main.js`, `manifest.json`, and `styles.css`.
3.  Enable in **Settings > Community Plugins**.

---

## 📝 Technical Details

*   **Algorithm**: SM-2 (SuperMemo-2).
*   **Storage**: SRS data and scores are saved in `data.json`.
*   **Author**: Infinition
*   **License**: MIT
