package sk.uniba.fmph.dai.researcher.entities.item;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import sk.uniba.fmph.dai.researcher.entities.BaseEntity;

@Getter
@Setter
@Entity
@Table(name = "item_files")
public class ItemFile extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private ResearchItem item;

    @Column(name = "file_path", length = 500, nullable = false)
    private String filePath;

    @Column(name = "file_name", length = 255, nullable = false)
    private String fileName;
}
