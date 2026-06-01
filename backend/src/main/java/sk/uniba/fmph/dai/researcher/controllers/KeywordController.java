package sk.uniba.fmph.dai.researcher.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import sk.uniba.fmph.dai.researcher.dtos.keywords.CreateKeywordRequest;
import sk.uniba.fmph.dai.researcher.dtos.keywords.KeywordResponse;

import java.util.List;
import java.util.UUID;
import sk.uniba.fmph.dai.researcher.services.KeywordService;

/**
 * REST controller for managing keywords (tags).
 *
 * <p>Keywords are user-defined labels that can be attached to research items
 * to enable filtering and boolean search. Each keyword belongs to the user
 * who created it.</p>
 *
 * <p>Base path: {@code /api/keywords}</p>
 */
@RestController
@RequestMapping("/api/keywords")
@RequiredArgsConstructor
public class KeywordController {

    private final KeywordService keywordService;

    /**
     * Returns all keywords belonging to the currently authenticated user.
     *
     * @return list of keywords
     */
    @GetMapping
    public List<KeywordResponse> findAll() {
        return keywordService.findAll();
    }

    /**
     * Creates a new keyword for the currently authenticated user.
     *
     * @param request keyword name
     * @return the created keyword
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public KeywordResponse create(@Valid @RequestBody CreateKeywordRequest request) {
        return keywordService.create(request);
    }

    /**
     * Deletes a keyword. The keyword is automatically removed from all items it was assigned to.
     *
     * @param id keyword UUID
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        keywordService.delete(id);
    }
}
