package sk.uniba.fmph.dai.researcher.dtos.item;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResearchItemRequest {

    @NotBlank
    private String title;

    private LocalDate date;

    @NotNull
    private UUID categoryId;

    private List<FieldValueRequest> fieldValues = List.of();

    private List<UUID> keywordIds = List.of();
}
