package sk.uniba.fmph.dai.researcher.item;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import sk.uniba.fmph.dai.researcher.common.entity.BaseEntity;

@Getter
@Setter
@Entity
@Table(name = "research_item_relations")
public class ResearchItemRelation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_item_id", nullable = false)
    private ResearchItem sourceItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_item_id", nullable = false)
    private ResearchItem targetItem;
}
