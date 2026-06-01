package sk.uniba.fmph.dai.researcher.dtos.item;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddLinkRequest {

    @NotBlank
    private String url;

    private String name;

    private String description;
}
