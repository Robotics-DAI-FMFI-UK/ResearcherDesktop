package sk.uniba.fmph.dai.researcher.entities.category;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import sk.uniba.fmph.dai.researcher.entities.BaseEntity;
import sk.uniba.fmph.dai.researcher.entities.User;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "categories")
public class Category extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_predefined", nullable = false)
    private boolean predefined;

    @Column(nullable = false, length = 50)
    private String icon = "folder";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    private List<CategoryField> fields = new ArrayList<>();
}
