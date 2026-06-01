package sk.uniba.fmph.dai.researcher.dtos.item;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sk.uniba.fmph.dai.researcher.entities.item.ItemLink;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ItemLinkResponse {

    private UUID id;
    private String url;
    private String name;
    private String description;
    private LocalDateTime createdAt;

    public static ItemLinkResponse from(ItemLink l) {
        return new ItemLinkResponse(l.getId(), l.getUrl(), l.getName(), l.getDescription(), l.getCreatedAt());
    }
}
