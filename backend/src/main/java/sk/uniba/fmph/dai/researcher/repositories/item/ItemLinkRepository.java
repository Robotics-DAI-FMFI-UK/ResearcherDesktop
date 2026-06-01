package sk.uniba.fmph.dai.researcher.repositories.item;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;
import sk.uniba.fmph.dai.researcher.entities.item.ItemLink;
import sk.uniba.fmph.dai.researcher.entities.item.ResearchItem;

public interface ItemLinkRepository extends JpaRepository<ItemLink, UUID> {
    Optional<ItemLink> findByIdAndItem(UUID id, ResearchItem item);
}
