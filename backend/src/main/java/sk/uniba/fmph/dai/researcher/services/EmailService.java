package sk.uniba.fmph.dai.researcher.services;

import jakarta.mail.internet.InternetAddress;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:${spring.mail.username}}")
    private String fromEmail;

    @Value("${app.mail-from-name:ResearchDesk}")
    private String fromName;

    @Value("${app.base-url}")
    private String baseUrl;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    private String from() {
        try { return new InternetAddress(fromEmail, fromName).toString(); }
        catch (Exception e) { return fromEmail; }
    }

    public void sendRegistrationApprovalRequest(String adminEmail, String username, String approveToken) {
        String from = from();
        log.info("Sending registration approval email: from={} to={} user={}", from, adminEmail, username);
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(adminEmail);
            msg.setSubject("ResearchDesk: new user registration — " + username);
            msg.setText("Hello,\n\n"
                    + "User \"" + username + "\" has submitted a registration request for ResearchDesk.\n\n"
                    + "To approve this user, open the following link in your browser:\n"
                    + baseUrl + "/api/admin/approve/" + approveToken + "\n\n"
                    + "To reject this user, open the following link:\n"
                    + baseUrl + "/api/admin/reject/" + approveToken + "\n\n"
                    + "This message was sent automatically by ResearchDesk.");
            mailSender.send(msg);
            log.info("Registration approval email sent successfully to {}", adminEmail);
        } catch (Exception e) {
            log.error("Failed to send registration approval email: from={} to={} error={}", from, adminEmail, e.getMessage(), e);
        }
    }

    public void sendRegistrationApproved(String userEmail, String username) {
        String from = from();
        log.info("Sending account approved email: from={} to={} user={}", from, userEmail, username);
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(userEmail);
            msg.setSubject("ResearchDesk: your account has been approved");
            msg.setText("Hello " + username + ",\n\n"
                    + "Your ResearchDesk account has been approved. You can now sign in at:\n"
                    + frontendUrl + "\n\n"
                    + "This message was sent automatically by ResearchDesk.");
            mailSender.send(msg);
            log.info("Account approved email sent successfully to {}", userEmail);
        } catch (Exception e) {
            log.error("Failed to send account approved email: from={} to={} error={}", from, userEmail, e.getMessage(), e);
        }
    }

    public void sendPasswordResetLink(String userEmail, String resetToken) {
        String from = from();
        log.info("Sending password reset email: from={} to={}", from, userEmail);
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(userEmail);
            msg.setSubject("ResearchDesk: password reset request");
            msg.setText("Hello,\n\n"
                    + "We received a request to reset your ResearchDesk password.\n\n"
                    + "To set a new password, open the following link in your browser:\n"
                    + frontendUrl + "/reset-password?token=" + resetToken + "\n\n"
                    + "This link expires in 1 hour. If you did not request a password reset, you can ignore this email.");
            mailSender.send(msg);
            log.info("Password reset email sent successfully to {}", userEmail);
        } catch (Exception e) {
            log.error("Failed to send password reset email: from={} to={} error={}", from, userEmail, e.getMessage(), e);
        }
    }
}
