package sk.uniba.fmph.dai.researcher.item.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResearchItemRequest {

    @NotBlank
    private String title;

    private String description;

    private LocalDate date;

    @NotNull
    private UUID categoryId;

    private String imagePath;

    private String filePath;
}
