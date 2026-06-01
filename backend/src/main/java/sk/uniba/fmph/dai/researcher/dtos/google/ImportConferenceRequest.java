package sk.uniba.fmph.dai.researcher.dtos.google;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ImportConferenceRequest {

    private ParsedConferenceDto conference;
    private boolean addToCalendar;
}
