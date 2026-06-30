package com.example.quizplatforme.Service;

/**
 * Contrat du service d'analyse de code via l'API Groq.
 *
 * <p>Ce service utilise le modèle LLaMA de Groq pour générer une explication
 * pédagogique en français à partir d'une erreur d'exécution de code étudiant.
 *
 * <p>À ne pas confondre avec {@link IGrokService} qui gère la <em>résumé de PDF</em>
 * via le même endpoint Groq mais avec un prompt différent.
 *
 * @see com.example.quizplatforme.Service.Impl.GroqAiServiceImpl
 */
public interface IGroqAiService {

    /**
     * Analyse une erreur d'exécution de code et retourne une explication pédagogique en français.
     *
     * @param code     le code source soumis par l'étudiant
     * @param error    le message d'erreur produit (stderr), peut être {@code null}
     * @param output   la sortie standard produite (stdout), peut être {@code null}
     * @param language le langage de programmation (ex. : "python", "java")
     * @return une analyse structurée en français : cause, détail, solution, conseil
     */
    String analyzeError(String code, String error, String output, String language);
}
