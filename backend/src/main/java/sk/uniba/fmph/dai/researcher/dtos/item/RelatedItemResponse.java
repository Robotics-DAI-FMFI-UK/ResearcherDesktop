package sk.uniba.fmph.dai.researcher.dtos.item;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sk.uniba.fmph.dai.researcher.entities.item.ResearchItem;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RelatedItemResponse {

    private UUID id;
    private String title;
    private String categoryName;

    public static RelatedItemResponse from(ResearchItem item) {
        return new RelatedItemResponse(
                item.getId(),
                item.getTitle(),
                item.getCategory().getName()
        );
    }
}
