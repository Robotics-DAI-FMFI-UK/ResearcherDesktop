package sk.uniba.fmph.dai.researcher.dtos.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PasswordResetRequest {

    @NotBlank
    private String username;

    @NotBlank
    @Email
    private String email;
}
