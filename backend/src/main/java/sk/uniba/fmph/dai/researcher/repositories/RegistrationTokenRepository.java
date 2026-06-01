package sk.uniba.fmph.dai.researcher.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import sk.uniba.fmph.dai.researcher.entities.RegistrationToken;

import java.util.Optional;
import java.util.UUID;

public interface RegistrationTokenRepository extends JpaRepository<RegistrationToken, UUID> {
    Optional<RegistrationToken> findByToken(String token);
}
