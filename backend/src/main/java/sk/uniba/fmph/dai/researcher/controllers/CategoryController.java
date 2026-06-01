package sk.uniba.fmph.dai.researcher.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import sk.uniba.fmph.dai.researcher.dtos.category.CategoryRequest;
import sk.uniba.fmph.dai.researcher.dtos.category.CategoryResponse;

import java.util.List;
import java.util.UUID;
import sk.uniba.fmph.dai.researcher.services.CategoryService;

/**
 * REST controller for managing research categories.
 *
 * <p>Categories group research items and may define custom fields.
 * Predefined categories are created automatically on registration;
 * users may also create their own custom categories.</p>
 *
 * <p>Base path: {@code /api/categories}</p>
 */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    /**
     * Returns all categories belonging to the currently authenticated user,
     * including item counts per category.
     *
     * @return list of categories
     */
    @GetMapping
    public List<CategoryResponse> findAll() {
        return categoryService.findAll();
    }

    /**
     * Returns a single category by its identifier.
     *
     * @param id category UUID
     * @return category details including its custom field definitions
     */
    @GetMapping("/{id}")
    public CategoryResponse findById(@PathVariable UUID id) {
        return categoryService.findById(id);
    }

    /**
     * Creates a new custom category for the currently authenticated user.
     *
     * @param request category name, icon, description and optional custom fields
     * @return the created category
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse create(@Valid @RequestBody CategoryRequest request) {
        return categoryService.create(request);
    }

    /**
     * Updates an existing category owned by the currently authenticated user.
     *
     * @param id      category UUID
     * @param request updated name, icon, description and custom fields
     * @return the updated category
     */
    @PutMapping("/{id}")
    public CategoryResponse update(@PathVariable UUID id, @Valid @RequestBody CategoryRequest request) {
        return categoryService.update(id, request);
    }

    /**
     * Deletes a category and all research items it contains,
     * including their associated files.
     *
     * @param id category UUID
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        categoryService.delete(id);
    }
}
