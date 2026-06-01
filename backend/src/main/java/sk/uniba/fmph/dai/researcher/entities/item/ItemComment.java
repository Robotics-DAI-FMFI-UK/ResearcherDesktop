package sk.uniba.fmph.dai.researcher.entities.item;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import sk.uniba.fmph.dai.researcher.entities.BaseEntity;

@Getter
@Setter
@Entity
@Table(name = "item_comments")
public class ItemComment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private ResearchItem item;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String text;
}
