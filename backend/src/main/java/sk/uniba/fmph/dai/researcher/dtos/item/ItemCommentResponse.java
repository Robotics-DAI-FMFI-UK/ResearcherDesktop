package sk.uniba.fmph.dai.researcher.dtos.item;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sk.uniba.fmph.dai.researcher.entities.item.ItemComment;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ItemCommentResponse {

    private UUID id;
    private String text;
    private LocalDateTime createdAt;

    public static ItemCommentResponse from(ItemComment c) {
        return new ItemCommentResponse(c.getId(), c.getText(), c.getCreatedAt());
    }
}
