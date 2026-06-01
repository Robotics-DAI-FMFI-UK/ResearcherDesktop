package sk.uniba.fmph.dai.researcher.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "google.calendar")
@Getter
@Setter
public class GoogleCalendarProperties {

    private String clientId = "";
    private String clientSecret = "";
    private String redirectUri = "http://localhost:8080/api/calendar/callback";
    private String frontendUrl = "http://localhost:5173";
}
