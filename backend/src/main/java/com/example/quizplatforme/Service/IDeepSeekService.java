package com.example.quizplatforme.Service;

/**
 * @deprecated Remplacée par {@link IGroqAiService}.
 *
 * <p>Cette interface portait un nom erroné : l'implémentation utilisait en réalité
 * l'API Groq (LLaMA) et non l'API DeepSeek.
 *
 * <p><strong>Peut être supprimée à la prochaine révision.</strong>
 * Elle ne déclare plus de méthodes pour éviter toute utilisation accidentelle.
 */
@Deprecated(since = "2.0", forRemoval = true)
public interface
IDeepSeekService {
    // Désactivée — utiliser IGroqAiService.
}
