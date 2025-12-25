
export const TRANSLATIONS = {
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
        completed: "Completed! 🎉",
        final_score: "Final score: ",
        incorrect: "Incorrect",
        correct: "Correct",
        settings_language: "Language",
        settings_language_desc: "Choose the language for the plugin interface.",
    },
    fr: {
        json_error: "Erreur JSON : ",
        launch_quiz: "Lancer le Quizz",
        launch_flashcards: "Lancer les Flashcards",
        last_score: "Dernier score : ",
        prev_score: "Précédent : ",
        none: "Aucun",
        next: "Suivant",
        finish: "Terminer",
        validate: "Valider",
        completed: "Terminé ! 🎉",
        final_score: "Score final : ",
        incorrect: "Incorrect",
        correct: "Correct",
        settings_language: "Langue",
        settings_language_desc: "Choisissez la langue de l'interface du plugin.",
    }
} as const;

export type Language = keyof typeof TRANSLATIONS;

export function t(key: keyof typeof TRANSLATIONS['en'], lang: Language = 'en'): string {
    return TRANSLATIONS[lang][key] || TRANSLATIONS['en'][key];
}
