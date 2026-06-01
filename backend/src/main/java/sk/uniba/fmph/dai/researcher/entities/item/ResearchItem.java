package sk.uniba.fmph.dai.researcher.entities.item;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import sk.uniba.fmph.dai.researcher.entities.category.Category;
import sk.uniba.fmph.dai.researcher.entities.BaseEntity;
import sk.uniba.fmph.dai.researcher.entities.User;
import sk.uniba.fmph.dai.researcher.entities.Keyword;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "research_items")
public class ResearchItem extends BaseEntity {

    @Column(nullable = false)
    private String title;

    private LocalDate date;

    @Column(length = 500)
    private String imagePath;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ItemFieldValue> fieldValues = new ArrayList<>();

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    private List<ItemFile> itemFiles = new ArrayList<>();

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    private List<ItemComment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    private List<ItemLink> links = new ArrayList<>();

    @Column(name = "gmail_message_id")
    private String gmailMessageId;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "item_keywords",
            joinColumns = @JoinColumn(name = "item_id"),
            inverseJoinColumns = @JoinColumn(name = "keyword_id")
    )
    private List<Keyword> keywords = new ArrayList<>();
}
