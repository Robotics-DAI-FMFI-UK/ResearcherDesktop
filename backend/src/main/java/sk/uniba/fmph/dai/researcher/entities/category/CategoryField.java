package sk.uniba.fmph.dai.researcher.entities.category;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import sk.uniba.fmph.dai.researcher.entities.BaseEntity;

@Getter
@Setter
@Entity
@Table(name = "category_fields")
public class CategoryField extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "field_type", nullable = false, length = 20)
    private FieldType fieldType;

    @Column(columnDefinition = "TEXT")
    private String options;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}