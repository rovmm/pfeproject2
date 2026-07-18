package com.example.quizplatforme.Service;

import com.example.quizplatforme.DTO.Request.ChatMessage;

import java.util.List;

/**
 * Contrat unique du service d'intelligence artificielle de la plateforme,
 * porté par l'API Grok.
 *
 * <p>Regroupe les trois usages IA de l'application, auparavant répartis sur
 * des services distincts (analyse de code, chat, résumé de PDF) :
 * <ul>
 *   <li>{@link #analyzeError} — explication pédagogique d'une erreur de code étudiant</li>
 *   <li>{@link #chat} — assistant conversationnel (chat IA, questions sur un fichier du Drive)</li>
 *   <li>{@link #summarize} — résumé de document (PDF)</li>
 * </ul>
 *
 * @see com.example.quizplatforme.Service.Impl.AiServiceImpl
 */
public interface IAiService {

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

    /**
     * Envoie une conversation à l'API Grok et retourne la réponse de l'assistant.
     *
     * @param systemPrompt        message système définissant le rôle/les limites de l'assistant
     * @param conversationHistory historique de la conversation (peut être vide ou {@code null})
     * @param userMessage         nouveau message de l'utilisateur
     * @return la réponse textuelle générée par l'IA
     */
    String chat(String systemPrompt, List<ChatMessage> conversationHistory, String userMessage);

    /**
     * Envoie un texte à l'API Grok et retourne un résumé en français.
     *
     * @param text le texte extrait à résumer
     * @return le résumé généré par l'IA
     */
    String summarize(String text);
}
