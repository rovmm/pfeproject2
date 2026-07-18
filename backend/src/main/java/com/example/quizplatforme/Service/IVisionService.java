package com.example.quizplatforme.Service;

/**
 * Contrat du service de lecture d'images par IA, distinct de {@link IAiService}.
 *
 * <p>Le modèle Groq utilisé par {@link IAiService} est un LLM texte seul et ne peut
 * pas interpréter d'images. Ce service passe par un second endpoint (Mistral via
 * Open WebUI, compatible OpenAI) qui accepte des images en entrée.
 *
 * @see com.example.quizplatforme.Service.Impl.VisionServiceImpl
 */
public interface IVisionService {

    /**
     * Décrit/transcrit le contenu d'une image pour un usage pédagogique.
     *
     * @param imageBytes contenu brut de l'image
     * @param mimeType   type MIME de l'image (ex. : {@code image/png})
     * @param prompt     instruction précisant ce qu'il faut faire de l'image
     *                   (ex. : "Transcris le texte visible sur cette image.")
     * @return le texte généré par le modèle de vision
     */
    String describeImage(byte[] imageBytes, String mimeType, String prompt);
}
