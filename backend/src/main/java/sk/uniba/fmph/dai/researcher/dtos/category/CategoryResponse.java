package sk.uniba.fmph.dai.researcher.dtos.category;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sk.uniba.fmph.dai.researcher.entities.category.Category;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {

    private UUID id;
    private String name;
    private String description;
    private boolean predefined;
    private String icon;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long itemCount;
    private List<CategoryFieldResponse> fields;

    public static CategoryResponse from(Category category) {
        return from(category, 0L);
    }

    public static CategoryResponse from(Category category, long itemCount) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.isPredefined(),
                category.getIcon() != null ? category.getIcon() : "folder",
                category.getCreatedAt(),
                category.getUpdatedAt(),
                itemCount,
                category.getFields().stream()
                        .map(CategoryFieldResponse::from)
                        .toList()
        );
    }
}
