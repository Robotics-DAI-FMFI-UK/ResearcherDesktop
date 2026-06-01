package sk.uniba.fmph.dai.researcher.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import sk.uniba.fmph.dai.researcher.entities.User;

import java.util.Optional;
import java.util.UUID;
import sk.uniba.fmph.dai.researcher.entities.UserGoogleToken;

public interface UserGoogleTokenRepository extends JpaRepository<UserGoogleToken, UUID> {

    Optional<UserGoogleToken> findByUser(User user);

    boolean existsByUser(User user);
}
