package sk.uniba.fmph.dai.researcher.category;

import org.springframework.data.jpa.repository.JpaRepository;
import sk.uniba.fmph.dai.researcher.common.entity.User;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    List<Category> findByOwner(User owner);

    Optional<Category> findByIdAndOwner(UUID id, User owner);
}
