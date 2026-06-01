package sk.uniba.fmph.dai.researcher.dtos.google;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreateEventRequest {

    @NotBlank
    private String summary;

    private String description;

    @NotBlank
    private String startDateTime;

    private String endDateTime;

    private String location;

    private Integer colorId;

    private boolean allDay;
}
