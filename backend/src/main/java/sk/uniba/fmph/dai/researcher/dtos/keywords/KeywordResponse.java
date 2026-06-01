package sk.uniba.fmph.dai.researcher.dtos.keywords;

import lombok.AllArgsConstructor;
import lombok.Getter;
import sk.uniba.fmph.dai.researcher.entities.Keyword;

import java.util.UUID;

@Getter
@AllArgsConstructor
public class KeywordResponse {

    private UUID id;
    private String name;

    public static KeywordResponse from(Keyword keyword) {
        return new KeywordResponse(keyword.getId(), keyword.getName());
    }
}
