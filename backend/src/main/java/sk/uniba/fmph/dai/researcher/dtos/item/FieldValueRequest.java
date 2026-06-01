package sk.uniba.fmph.dai.researcher.dtos.item;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class FieldValueRequest {

    private UUID fieldId;
    private String value;
}
