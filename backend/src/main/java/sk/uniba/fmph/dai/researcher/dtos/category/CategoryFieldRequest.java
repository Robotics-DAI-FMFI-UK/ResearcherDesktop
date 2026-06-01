package sk.uniba.fmph.dai.researcher.dtos.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sk.uniba.fmph.dai.researcher.entities.category.FieldType;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class CategoryFieldRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    @NotNull
    private FieldType fieldType;

    private List<String> options = List.of();

    private int sortOrder;
}
