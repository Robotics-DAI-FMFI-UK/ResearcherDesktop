package sk.uniba.fmph.dai.researcher.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import sk.uniba.fmph.dai.researcher.common.entity.User;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);
}