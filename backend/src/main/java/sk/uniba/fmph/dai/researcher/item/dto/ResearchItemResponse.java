package sk.uniba.fmph.dai.researcher.item.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sk.uniba.fmph.dai.researcher.item.ResearchItem;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResearchItemResponse {

    private UUID id;
    private String title;
    private String description;
    private LocalDate date;
    private String imagePath;
    private String filePath;
    private String fileName;
    private UUID categoryId;
    private String categoryName;
    private List<RelatedItemResponse> relatedItems;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ResearchItemResponse from(ResearchItem item, List<RelatedItemResponse> relatedItems) {
        return new ResearchItemResponse(
                item.getId(),
                item.getTitle(),
                item.getDescription(),
                item.getDate(),
                item.getImagePath(),
                item.getFilePath(),
                item.getFileName(),
                item.getCategory().getId(),
                item.getCategory().getName(),
                relatedItems,
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
