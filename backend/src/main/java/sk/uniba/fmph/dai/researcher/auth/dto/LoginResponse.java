package sk.uniba.fmph.dai.researcher.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LoginResponse {

    private String token;
    private String username;
    private String role;
    private String mode;
}
