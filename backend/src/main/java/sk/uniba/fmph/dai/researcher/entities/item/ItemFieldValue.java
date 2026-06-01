package sk.uniba.fmph.dai.researcher.entities.item;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import sk.uniba.fmph.dai.researcher.entities.category.CategoryField;
import sk.uniba.fmph.dai.researcher.entities.BaseEntity;

@Getter
@Setter
@Entity
@Table(name = "item_field_values")
public class ItemFieldValue extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private ResearchItem item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "field_id", nullable = false)
    private CategoryField field;

    @Column(columnDefinition = "TEXT")
    private String value;
}
