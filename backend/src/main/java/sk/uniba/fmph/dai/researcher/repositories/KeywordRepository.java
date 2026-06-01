package sk.uniba.fmph.dai.researcher.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import sk.uniba.fmph.dai.researcher.entities.User;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import sk.uniba.fmph.dai.researcher.entities.Keyword;

public interface KeywordRepository extends JpaRepository<Keyword, UUID> {

    List<Keyword> findByOwner(User owner);

    List<Keyword> findAllByIdInAndOwner(Collection<UUID> ids, User owner);

    Optional<Keyword> findByIdAndOwner(UUID id, User owner);

    @Query("SELECT k FROM Keyword k WHERE k.owner = :owner " +
           "AND (SELECT COUNT(i) FROM ResearchItem i WHERE k MEMBER OF i.keywords) = 0 " +
           "AND LOWER(k.name) NOT IN (SELECT LOWER(c.name) FROM Category c WHERE c.owner = :owner)")
    List<Keyword> findOrphansByOwner(@Param("owner") User owner);
}
