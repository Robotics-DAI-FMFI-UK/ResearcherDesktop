package sk.uniba.fmph.dai.researcher.dtos.google;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventDto {

    private String id;
    private String summary;
    private String description;
    private String start;
    private String end;
    private String htmlLink;
    private String colorId;
    private String location;
}
