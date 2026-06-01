package sk.uniba.fmph.dai.researcher.repositories.item;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;
import sk.uniba.fmph.dai.researcher.entities.item.ResearchItem;
import sk.uniba.fmph.dai.researcher.entities.item.ResearchItemRelation;

public interface ResearchItemRelationRepository extends JpaRepository<ResearchItemRelation, UUID> {

    @Query("SELECT r FROM ResearchItemRelation r WHERE r.sourceItem = :item OR r.targetItem = :item")
    List<ResearchItemRelation> findAllByItem(@Param("item") ResearchItem item);

    @Query("""
            SELECT COUNT(r) > 0 FROM ResearchItemRelation r WHERE \
            (r.sourceItem = :a AND r.targetItem = :b) OR (r.sourceItem = :b AND r.targetItem = :a)\
            """)
    boolean existsLink(@Param("a") ResearchItem a, @Param("b") ResearchItem b);

    @Modifying
    @Query("""
            DELETE FROM ResearchItemRelation r WHERE \
            (r.sourceItem = :a AND r.targetItem = :b) OR (r.sourceItem = :b AND r.targetItem = :a)\
            """)
    void deleteLink(@Param("a") ResearchItem a, @Param("b") ResearchItem b);
}
