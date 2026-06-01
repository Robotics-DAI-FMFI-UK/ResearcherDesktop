package sk.uniba.fmph.dai.researcher.dtos.google;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ParsedConferenceDto {

    private String title;
    private String deadline;
    private String abstractDeadline;
    private String paperDeadline;
    private String cameraReadyDeadline;
    private String url;
    private String location;
    private String emailSubject;
    private String emailDate;
    private String messageId;
    private boolean alreadyImported;
    private String startDate;
    private String endDate;
    private String contactEmail;
    private String submissionUrl;
    private String bodyText;
    private String sender;
}
