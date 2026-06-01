package sk.uniba.fmph.dai.researcher.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import sk.uniba.fmph.dai.researcher.entities.PasswordResetToken;

import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
    Optional<PasswordResetToken> findByToken(String token);
}
