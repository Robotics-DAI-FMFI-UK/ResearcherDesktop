package sk.uniba.fmph.dai.researcher.dtos.item;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sk.uniba.fmph.dai.researcher.entities.category.FieldType;
import sk.uniba.fmph.dai.researcher.entities.item.ItemFieldValue;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ItemFieldValueResponse {

    private UUID fieldId;
    private String fieldName;
    private FieldType fieldType;
    private List<String> options;
    private String value;

    public static ItemFieldValueResponse from(ItemFieldValue fv) {
        var field = fv.getField();
        List<String> options = List.of();
        if (field.getFieldType() == FieldType.DROPDOWN && field.getOptions() != null) {
            options = Arrays.stream(field.getOptions().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }
        return new ItemFieldValueResponse(
                field.getId(),
                field.getName(),
                field.getFieldType(),
                options,
                fv.getValue()
        );
    }
}
