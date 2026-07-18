package com.example.quizplatforme.Service;

/**
 * Contrat du service d'envoi d'e-mails transactionnels (codes OTP).
 *
 * <p>L'envoi est asynchrone ({@code @Async} côté implémentation) : les
 * appelants (inscription, mot de passe oublié, renvoi de code) ne bloquent
 * jamais sur la latence SMTP.
 */
public interface IEmailService {

    /**
     * Envoie un e-mail contenant un code OTP à 6 chiffres.
     *
     * @param toEmail  adresse e-mail du destinataire
     * @param fullName nom complet du destinataire (personnalisation du message)
     * @param otp      code OTP à 6 chiffres
     * @param type     type de code : {@code EMAIL_VERIFICATION} ou {@code PASSWORD_RESET}
     */
    void sendOtpEmail(String toEmail, String fullName, String otp, String type);
}
