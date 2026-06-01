package sk.uniba.fmph.dai.researcher.item;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import sk.uniba.fmph.dai.researcher.item.dto.ResearchItemRequest;
import sk.uniba.fmph.dai.researcher.item.dto.ResearchItemResponse;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ResearchItemController {

    private final ResearchItemService itemService;

    @GetMapping
    public List<ResearchItemResponse> findAll(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String search) {
        return itemService.findAll(categoryId, search);
    }

    @GetMapping("/{id}")
    public ResearchItemResponse findById(@PathVariable UUID id) {
        return itemService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResearchItemResponse create(@Valid @RequestBody ResearchItemRequest request) {
        return itemService.create(request);
    }

    @PutMapping("/{id}")
    public ResearchItemResponse update(@PathVariable UUID id, @Valid @RequestBody ResearchItemRequest request) {
        return itemService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        itemService.delete(id);
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResearchItemResponse uploadImage(@PathVariable UUID id,
                                            @RequestParam("file") MultipartFile file) {
        return itemService.uploadImage(id, file);
    }

    @PostMapping(value = "/{id}/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResearchItemResponse uploadFile(@PathVariable UUID id,
                                           @RequestParam("file") MultipartFile file) {
        return itemService.uploadFile(id, file);
    }

    @PostMapping("/{id}/relations/{targetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addRelation(@PathVariable UUID id, @PathVariable UUID targetId) {
        itemService.addRelation(id, targetId);
    }

    @DeleteMapping("/{id}/relations/{targetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeRelation(@PathVariable UUID id, @PathVariable UUID targetId) {
        itemService.removeRelation(id, targetId);
    }
}
