package sk.uniba.fmph.dai.researcher.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import sk.uniba.fmph.dai.researcher.dtos.item.AddCommentRequest;
import sk.uniba.fmph.dai.researcher.dtos.item.AddLinkRequest;
import sk.uniba.fmph.dai.researcher.dtos.item.ItemCommentResponse;
import sk.uniba.fmph.dai.researcher.dtos.item.ItemLinkResponse;
import sk.uniba.fmph.dai.researcher.dtos.item.ResearchItemRequest;
import sk.uniba.fmph.dai.researcher.dtos.item.ResearchItemResponse;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import sk.uniba.fmph.dai.researcher.services.ResearchItemService;

/**
 * REST controller for managing research items.
 *
 * <p>Research items are the core data entities of the application. Each item belongs
 * to a category and may have custom field values, an image, attached files,
 * keywords, related items, comments, and external links.</p>
 *
 * <p>Base path: {@code /api/items}</p>
 */
@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ResearchItemController {

    private final ResearchItemService itemService;

    /**
     * Returns all research items belonging to the authenticated user,
     * with optional filtering by category, text search, and keyword boolean operators.
     *
     * @param categoryId  optional category filter
     * @param search      optional full-text search string matched against title and description
     * @param keywords    optional comma-separated keyword UUIDs (used with {@code keywordOp})
     * @param keywordOp   operator for {@code keywords}: {@code AND}, {@code OR}, or {@code NOT}
     * @param andKeywords optional comma-separated keyword UUIDs that must ALL be present
     * @param orKeywords  optional comma-separated keyword UUIDs where ANY must be present
     * @param notKeywords optional comma-separated keyword UUIDs that must NOT be present
     * @return filtered list of research items
     */
    @GetMapping
    public List<ResearchItemResponse> findAll(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String keywords,
            @RequestParam(required = false) String keywordOp,
            @RequestParam(required = false) String andKeywords,
            @RequestParam(required = false) String orKeywords,
            @RequestParam(required = false) String notKeywords) {
        List<UUID> keywordIds = parseKeywordIds(keywords);
        List<UUID> andIds = parseKeywordIds(andKeywords);
        List<UUID> orIds  = parseKeywordIds(orKeywords);
        List<UUID> notIds = parseKeywordIds(notKeywords);
        return itemService.findAll(categoryId, search, keywordIds, keywordOp, andIds, orIds, notIds);
    }

    private List<UUID> parseKeywordIds(String keywords) {
        if (keywords == null || keywords.isBlank()) { return List.of(); }
        return Arrays.stream(keywords.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(UUID::fromString)
                .toList();
    }

    /**
     * Returns a single research item by its identifier.
     *
     * @param id item UUID
     * @return full item details including field values, files, comments and links
     */
    @GetMapping("/{id}")
    public ResearchItemResponse findById(@PathVariable UUID id) {
        return itemService.findById(id);
    }

    /**
     * Creates a new research item.
     *
     * @param request item data including title, category, custom field values and keyword IDs
     * @return the created item
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResearchItemResponse create(@Valid @RequestBody ResearchItemRequest request) {
        return itemService.create(request);
    }

    /**
     * Updates an existing research item.
     *
     * @param id      item UUID
     * @param request updated item data
     * @return the updated item
     */
    @PutMapping("/{id}")
    public ResearchItemResponse update(@PathVariable UUID id, @Valid @RequestBody ResearchItemRequest request) {
        return itemService.update(id, request);
    }

    /**
     * Deletes a research item along with its image and all attached files.
     *
     * @param id item UUID
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        itemService.delete(id);
    }

    /**
     * Uploads or replaces the cover image for a research item.
     *
     * @param id   item UUID
     * @param file image file (JPEG, PNG, etc.)
     * @return updated item with the new image path
     */
    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResearchItemResponse uploadImage(@PathVariable UUID id,
                                            @RequestParam("file") MultipartFile file) {
        return itemService.uploadImage(id, file);
    }

    /**
     * Attaches a file to a research item.
     *
     * @param id   item UUID
     * @param file file to attach (PDF, DOCX, etc.)
     * @return updated item with the new file listed
     */
    @PostMapping(value = "/{id}/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResearchItemResponse addFile(@PathVariable UUID id,
                                        @RequestParam("file") MultipartFile file) {
        return itemService.addFile(id, file);
    }

    /**
     * Removes an attached file from a research item and deletes it from storage.
     *
     * @param id     item UUID
     * @param fileId file UUID
     */
    @DeleteMapping("/{id}/files/{fileId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFile(@PathVariable UUID id, @PathVariable UUID fileId) {
        itemService.deleteFile(id, fileId);
    }

    /**
     * Creates a bidirectional relation between two research items.
     *
     * @param id       source item UUID
     * @param targetId target item UUID
     */
    @PostMapping("/{id}/relations/{targetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addRelation(@PathVariable UUID id, @PathVariable UUID targetId) {
        itemService.addRelation(id, targetId);
    }

    /**
     * Removes the relation between two research items.
     *
     * @param id       source item UUID
     * @param targetId target item UUID
     */
    @DeleteMapping("/{id}/relations/{targetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeRelation(@PathVariable UUID id, @PathVariable UUID targetId) {
        itemService.removeRelation(id, targetId);
    }

    /**
     * Adds a comment to a research item.
     *
     * @param id      item UUID
     * @param request comment text
     * @return the created comment
     */
    @PostMapping("/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public ItemCommentResponse addComment(@PathVariable UUID id,
                                          @Valid @RequestBody AddCommentRequest request) {
        return itemService.addComment(id, request);
    }

    /**
     * Updates the text of an existing comment on a research item.
     *
     * @param id        item UUID
     * @param commentId comment UUID
     * @param request   updated comment text
     * @return the updated comment
     */
    @PutMapping("/{id}/comments/{commentId}")
    public ResponseEntity<ItemCommentResponse> updateComment(
            @PathVariable UUID id,
            @PathVariable UUID commentId,
            @RequestBody @Valid AddCommentRequest request) {
        return ResponseEntity.ok(itemService.updateComment(id, commentId, request.getText()));
    }

    /**
     * Deletes a comment from a research item.
     *
     * @param id        item UUID
     * @param commentId comment UUID
     */
    @DeleteMapping("/{id}/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(@PathVariable UUID id, @PathVariable UUID commentId) {
        itemService.deleteComment(id, commentId);
    }

    /**
     * Adds an external link to a research item.
     *
     * @param id      item UUID
     * @param request link URL and optional label
     * @return the created link
     */
    @PostMapping("/{id}/links")
    @ResponseStatus(HttpStatus.CREATED)
    public ItemLinkResponse addLink(@PathVariable UUID id,
                                    @Valid @RequestBody AddLinkRequest request) {
        return itemService.addLink(id, request);
    }

    /**
     * Removes an external link from a research item.
     *
     * @param id     item UUID
     * @param linkId link UUID
     */
    @DeleteMapping("/{id}/links/{linkId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteLink(@PathVariable UUID id, @PathVariable UUID linkId) {
        itemService.deleteLink(id, linkId);
    }
}
