package sk.uniba.fmph.dai.researcher.repositories.item;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;
import sk.uniba.fmph.dai.researcher.entities.item.ItemComment;
import sk.uniba.fmph.dai.researcher.entities.item.ResearchItem;

public interface ItemCommentRepository extends JpaRepository<ItemComment, UUID> {
    Optional<ItemComment> findByIdAndItem(UUID id, ResearchItem item);
}
