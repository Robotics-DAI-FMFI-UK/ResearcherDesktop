package sk.uniba.fmph.dai.researcher.item;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import sk.uniba.fmph.dai.researcher.category.Category;
import sk.uniba.fmph.dai.researcher.common.entity.BaseEntity;
import sk.uniba.fmph.dai.researcher.common.entity.User;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "research_items")
public class ResearchItem extends BaseEntity {

    @Column(nullable = false)
    private String title;

    private String description;

    private LocalDate date;

    @Column(length = 500)
    private String imagePath;

    @Column(length = 500)
    private String filePath;

    @Column(length = 255)
    private String fileName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;
}
