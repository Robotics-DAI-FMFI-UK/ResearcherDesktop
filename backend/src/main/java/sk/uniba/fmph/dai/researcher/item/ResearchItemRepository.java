package sk.uniba.fmph.dai.researcher.item;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import sk.uniba.fmph.dai.researcher.category.Category;
import sk.uniba.fmph.dai.researcher.common.entity.User;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ResearchItemRepository extends JpaRepository<ResearchItem, UUID> {

    List<ResearchItem> findByOwner(User owner);

    List<ResearchItem> findByOwnerAndCategory(User owner, Category category);

    Optional<ResearchItem> findByIdAndOwner(UUID id, User owner);

    @Query("SELECT i.category.id, COUNT(i) FROM ResearchItem i WHERE i.owner = :owner GROUP BY i.category.id")
    List<Object[]> countByOwnerGroupedByCategory(@Param("owner") User owner);

    @Query(value = """
            SELECT * FROM research_items
            WHERE owner_id = :ownerId
              AND search_vector @@ plainto_tsquery('english', :search)
            """, nativeQuery = true)
    List<ResearchItem> search(@Param("ownerId") UUID ownerId, @Param("search") String search);

    @Query(value = """
            SELECT * FROM research_items
            WHERE owner_id = :ownerId
              AND category_id = :categoryId
              AND search_vector @@ plainto_tsquery('english', :search)
            """, nativeQuery = true)
    List<ResearchItem> searchInCategory(
            @Param("ownerId") UUID ownerId,
            @Param("categoryId") UUID categoryId,
            @Param("search") String search);
}
