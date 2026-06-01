package sk.uniba.fmph.dai.researcher.repositories.category;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import sk.uniba.fmph.dai.researcher.entities.User;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import sk.uniba.fmph.dai.researcher.entities.category.Category;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    @EntityGraph(attributePaths = {"fields"})
    List<Category> findByOwner(User owner);

    @EntityGraph(attributePaths = {"fields"})
    Optional<Category> findByIdAndOwner(UUID id, User owner);
}
