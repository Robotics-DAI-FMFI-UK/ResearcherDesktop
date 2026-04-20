package sk.uniba.fmph.dai.researcher.auth.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import sk.uniba.fmph.dai.researcher.common.entity.User;

@Getter
@Setter
public class UpdateModeRequest {

    @NotNull
    private User.Mode mode;
}
