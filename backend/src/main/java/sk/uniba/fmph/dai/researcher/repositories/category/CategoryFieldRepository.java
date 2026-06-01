package sk.uniba.fmph.dai.researcher.repositories.category;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import sk.uniba.fmph.dai.researcher.entities.category.CategoryField;

public interface CategoryFieldRepository extends JpaRepository<CategoryField, UUID> {
}