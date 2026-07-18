package com.example.quizplatforme.Service.Impl;

import com.example.quizplatforme.Service.IEmailService;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Implémentation de l'envoi d'e-mails via SMTP (Gmail).
 *
 * <p>L'envoi échoue silencieusement (journalisé en erreur) plutôt que de
 * propager l'exception : un échec SMTP ne doit jamais faire échouer
 * l'inscription ou la demande de réinitialisation de mot de passe, qui ont
 * déjà persisté leur état en base au moment de l'appel.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements IEmailService {

    @Value("${spring.mail.username}")
    private String from;

    @Value("${app.email.from-name}")
    private String fromName;

    private final JavaMailSender mailSender;

    @Override
    @Async
    public void sendOtpEmail(String toEmail, String fullName, String otp, String type) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(new InternetAddress(from, fromName));
            helper.setTo(toEmail);

            boolean isVerification = type.equals("EMAIL_VERIFICATION");
            helper.setSubject(isVerification
                    ? "SmartStudy — Verify your email"
                    : "SmartStudy — Reset your password");

            String title = isVerification ? "Email Verification" : "Password Reset";

            String instruction = isVerification
                    ? "Enter this code to activate your account:"
                    : "Enter this code to reset your password:";

            String warning = isVerification
                    ? "If you did not create a SmartStudy account, ignore this email."
                    : "If you did not request a password reset, ignore this email.";

            String html = """
                    <!DOCTYPE html>
                    <html>
                    <head><meta charset="UTF-8"></head>
                    <body style="font-family:Arial,sans-serif;
                                 background:#f5f5f5;
                                 margin:0;padding:20px;">
                      <div style="max-width:520px;margin:0 auto;
                                  background:white;border-radius:16px;
                                  overflow:hidden;
                                  box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                        <div style="background:linear-gradient(135deg,#1d4ed8,#2563EB);
                                    padding:36px;text-align:center;">
                          <h1 style="color:white;margin:0;
                                     font-size:28px;font-weight:700;">
                            SmartStudy
                          </h1>
                          <p style="color:#BFDBFE;margin:6px 0 0;
                                    font-size:14px;">
                            Academic Coding Platform
                          </p>
                        </div>
                        <div style="padding:36px;">
                          <h2 style="color:#111827;margin-top:0;">%s</h2>
                          <p style="color:#4B5563;">
                            Hello <strong>%s</strong>,
                          </p>
                          <p style="color:#4B5563;">%s</p>
                          <div style="background:#EFF6FF;
                                      border:2px solid #BFDBFE;
                                      border-radius:16px;
                                      padding:28px;
                                      text-align:center;
                                      margin:28px 0;">
                            <span style="font-size:48px;
                                         font-weight:800;
                                         letter-spacing:16px;
                                         color:#1D4ED8;
                                         font-family:monospace;">
                              %s
                            </span>
                          </div>
                          <p style="color:#6B7280;font-size:14px;">
                            This code expires in <strong>15 minutes</strong>.
                          </p>
                          <p style="color:#6B7280;font-size:14px;">
                            Maximum <strong>3 attempts</strong> allowed.
                          </p>
                          <hr style="border:none;
                                     border-top:1px solid #E5E7EB;
                                     margin:24px 0;">
                          <p style="color:#9CA3AF;font-size:13px;">
                            %s
                          </p>
                        </div>
                        <div style="background:#F9FAFB;padding:20px;
                                    text-align:center;
                                    border-top:1px solid #E5E7EB;">
                          <p style="color:#9CA3AF;font-size:12px;margin:0;">
                            © 2025 SmartStudy
                          </p>
                        </div>
                      </div>
                    </body>
                    </html>
                    """.formatted(title, fullName, instruction, otp, warning);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("OTP email sent successfully to {}", toEmail);

        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
        }
    }
}
