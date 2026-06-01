package sk.uniba.fmph.dai.researcher.dtos.google;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class GoogleEventsResponse {

    private List<GoogleEvent> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GoogleEvent {
        private String id;
        private String summary;
        private String description;
        private EventTime start;
        private EventTime end;
        private String htmlLink;
        private String colorId;
        private String location;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class EventTime {
        private String dateTime;
        private String date;
    }
}
