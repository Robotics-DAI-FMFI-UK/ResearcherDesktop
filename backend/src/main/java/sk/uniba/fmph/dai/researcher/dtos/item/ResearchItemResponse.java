package sk.uniba.fmph.dai.researcher.dtos.item;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sk.uniba.fmph.dai.researcher.entities.item.ResearchItem;
import sk.uniba.fmph.dai.researcher.dtos.keywords.KeywordResponse;

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
    private LocalDate date;
    private String imagePath;
    private UUID categoryId;
    private String categoryName;
    private List<RelatedItemResponse> relatedItems;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ItemFieldValueResponse> fieldValues;
    private List<ItemFileResponse> files;
    private List<ItemCommentResponse> comments;
    private List<ItemLinkResponse> links;
    private List<KeywordResponse> keywords;

    public static ResearchItemResponse from(
            ResearchItem item,
            List<RelatedItemResponse> relatedItems,
            List<ItemFieldValueResponse> fieldValues,
            List<ItemFileResponse> files,
            List<ItemCommentResponse> comments,
            List<ItemLinkResponse> links,
            List<KeywordResponse> keywords) {
        return new ResearchItemResponse(
                item.getId(),
                item.getTitle(),
                item.getDate(),
                item.getImagePath(),
                item.getCategory().getId(),
                item.getCategory().getName(),
                relatedItems,
                item.getCreatedAt(),
                item.getUpdatedAt(),
                fieldValues,
                files,
                comments,
                links,
                keywords
        );
    }
}
