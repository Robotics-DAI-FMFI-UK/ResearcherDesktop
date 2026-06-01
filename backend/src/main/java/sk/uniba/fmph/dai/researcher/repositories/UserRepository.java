package sk.uniba.fmph.dai.researcher.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import sk.uniba.fmph.dai.researcher.entities.User;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByUsernameAndEmail(String username, String email);
}