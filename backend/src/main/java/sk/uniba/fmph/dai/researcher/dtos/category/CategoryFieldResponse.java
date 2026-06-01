package sk.uniba.fmph.dai.researcher.dtos.category;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sk.uniba.fmph.dai.researcher.entities.category.CategoryField;
import sk.uniba.fmph.dai.researcher.entities.category.FieldType;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CategoryFieldResponse {

    private UUID id;
    private String name;
    private FieldType fieldType;
    private List<String> options;
    private int sortOrder;

    public static CategoryFieldResponse from(CategoryField field) {
        List<String> options = List.of();
        if (field.getFieldType() == FieldType.DROPDOWN && field.getOptions() != null) {
            options = Arrays.stream(field.getOptions().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }
        return new CategoryFieldResponse(
                field.getId(),
                field.getName(),
                field.getFieldType(),
                options,
                field.getSortOrder()
        );
    }
}
