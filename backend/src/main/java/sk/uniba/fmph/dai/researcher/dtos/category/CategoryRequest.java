package sk.uniba.fmph.dai.researcher.dtos.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CategoryRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    private String description;

    private String icon = "folder";

    private List<CategoryFieldRequest> fields = List.of();
}
