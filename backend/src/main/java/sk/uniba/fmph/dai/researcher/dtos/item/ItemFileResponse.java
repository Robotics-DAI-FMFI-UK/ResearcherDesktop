package sk.uniba.fmph.dai.researcher.dtos.item;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import sk.uniba.fmph.dai.researcher.entities.item.ItemFile;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ItemFileResponse {

    private UUID id;
    private String fileName;
    private String filePath;

    public static ItemFileResponse from(ItemFile file) {
        return new ItemFileResponse(file.getId(), file.getFileName(), file.getFilePath());
    }
}
