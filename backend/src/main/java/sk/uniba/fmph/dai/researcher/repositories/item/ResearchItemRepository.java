package sk.uniba.fmph.dai.researcher.repositories.item;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import sk.uniba.fmph.dai.researcher.entities.category.Category;
import sk.uniba.fmph.dai.researcher.entities.User;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import sk.uniba.fmph.dai.researcher.entities.item.ResearchItem;

public interface ResearchItemRepository extends JpaRepository<ResearchItem, UUID> {

    List<ResearchItem> findByOwner(User owner);

    List<ResearchItem> findByOwnerAndCategory(User owner, Category category);

    Optional<ResearchItem> findByIdAndOwner(UUID id, User owner);

    boolean existsByGmailMessageIdAndOwner(String gmailMessageId, User owner);

    @Query("SELECT i.category.id, COUNT(i) FROM ResearchItem i WHERE i.owner = :owner GROUP BY i.category.id")
    List<Object[]> countByOwnerGroupedByCategory(@Param("owner") User owner);

    @Query(value = """
            SELECT DISTINCT ri.* FROM research_items ri
            LEFT JOIN item_field_values ifv ON ifv.item_id = ri.id
            WHERE ri.owner_id = :ownerId
              AND (ri.search_vector @@ plainto_tsquery('english', :search)
                   OR ifv.value ILIKE '%' || :search || '%')
            """, nativeQuery = true)
    List<ResearchItem> search(@Param("ownerId") UUID ownerId, @Param("search") String search);

    @Query(value = """
            SELECT DISTINCT ri.* FROM research_items ri
            LEFT JOIN item_field_values ifv ON ifv.item_id = ri.id
            WHERE ri.owner_id = :ownerId
              AND ri.category_id = :categoryId
              AND (ri.search_vector @@ plainto_tsquery('english', :search)
                   OR ifv.value ILIKE '%' || :search || '%')
            """, nativeQuery = true)
    List<ResearchItem> searchInCategory(
            @Param("ownerId") UUID ownerId,
            @Param("categoryId") UUID categoryId,
            @Param("search") String search);
}
