package sk.uniba.fmph.dai.researcher.services;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sk.uniba.fmph.dai.researcher.repositories.UserRepository;
import sk.uniba.fmph.dai.researcher.dtos.category.CategoryFieldRequest;
import sk.uniba.fmph.dai.researcher.dtos.category.CategoryRequest;
import sk.uniba.fmph.dai.researcher.dtos.category.CategoryResponse;
import sk.uniba.fmph.dai.researcher.exceptions.ResourceNotFoundException;
import sk.uniba.fmph.dai.researcher.entities.User;
import sk.uniba.fmph.dai.researcher.services.FileStorageService;
import sk.uniba.fmph.dai.researcher.entities.item.ItemFile;
import sk.uniba.fmph.dai.researcher.entities.item.ResearchItem;
import sk.uniba.fmph.dai.researcher.repositories.item.ResearchItemRepository;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import sk.uniba.fmph.dai.researcher.entities.category.Category;
import sk.uniba.fmph.dai.researcher.entities.category.CategoryField;
import sk.uniba.fmph.dai.researcher.entities.category.FieldType;
import sk.uniba.fmph.dai.researcher.repositories.category.CategoryRepository;

/**
 * Service for managing research categories.
 *
 * <p>All operations are scoped to the currently authenticated user —
 * a user can only read, modify, or delete their own categories.</p>
 */
@Service
@Transactional
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ResearchItemRepository researchItemRepository;
    private final FileStorageService fileStorageService;

    /**
     * Returns all categories owned by the current user, including item counts.
     *
     * @return list of categories with item counts
     */
    public List<CategoryResponse> findAll() {
        User currentUser = getCurrentUser();
        Map<UUID, Long> countMap = researchItemRepository.countByOwnerGroupedByCategory(currentUser)
                .stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (Long) row[1]));
        List<CategoryResponse> categories = categoryRepository.findByOwner(currentUser).stream()
                .map(c -> CategoryResponse.from(c, countMap.getOrDefault(c.getId(), 0L)))
                .collect(Collectors.toCollection(java.util.ArrayList::new));
        categories.sort(Comparator.comparing(CategoryResponse::getName, String.CASE_INSENSITIVE_ORDER));
        return categories;
    }

    /**
     * Returns a single category by ID, scoped to the current user.
     *
     * @param id category UUID
     * @return category with its field definitions
     * @throws ResourceNotFoundException if not found or not owned by the current user
     */
    public CategoryResponse findById(UUID id) {
        User currentUser = getCurrentUser();
        return categoryRepository.findByIdAndOwner(id, currentUser)
                .map(CategoryResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
    }

    /**
     * Creates a new custom category for the current user.
     *
     * @param request category name, icon, description and optional field definitions
     * @return the persisted category
     */
    public CategoryResponse create(CategoryRequest request) {
        User currentUser = getCurrentUser();
        Category category = new Category();
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setIcon(request.getIcon() != null ? request.getIcon() : "folder");
        category.setPredefined(false);
        category.setOwner(currentUser);
        applyFields(category, request.getFields());
        return CategoryResponse.from(categoryRepository.save(category));
    }

    /**
     * Updates an existing category owned by the current user.
     *
     * <p>All field definitions are replaced by the ones provided in the request.</p>
     *
     * @param id      category UUID
     * @param request updated name, icon, description and field definitions
     * @return the updated category
     * @throws ResourceNotFoundException if not found or not owned by the current user
     */
    public CategoryResponse update(UUID id, CategoryRequest request) {
        User currentUser = getCurrentUser();
        Category category = categoryRepository.findByIdAndOwner(id, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        if (request.getIcon() != null) {
            category.setIcon(request.getIcon());
        }
        applyFields(category, request.getFields());
        return CategoryResponse.from(categoryRepository.save(category));
    }

    /**
     * Deletes a category and all research items it contains.
     *
     * <p>Files and images associated with each item are also removed from storage.</p>
     *
     * @param id category UUID
     * @throws ResourceNotFoundException if not found or not owned by the current user
     */
    public void delete(UUID id) {
        User currentUser = getCurrentUser();
        Category category = categoryRepository.findByIdAndOwner(id, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));

        List<ResearchItem> items = researchItemRepository.findByOwnerAndCategory(currentUser, category);
        for (ResearchItem item : items) {
            fileStorageService.delete(item.getImagePath());
            for (ItemFile f : item.getItemFiles()) {
                fileStorageService.delete(f.getFilePath());
            }
        }
        researchItemRepository.deleteAll(items);

        categoryRepository.delete(category);
    }

    private void applyFields(Category category, List<CategoryFieldRequest> fieldRequests) {
        category.getFields().clear();
        if (fieldRequests == null || fieldRequests.isEmpty()) {
            return;
        }
        for (int i = 0; i < fieldRequests.size(); i++) {
            CategoryFieldRequest fr = fieldRequests.get(i);
            CategoryField cf = new CategoryField();
            cf.setCategory(category);
            cf.setName(fr.getName());
            cf.setFieldType(fr.getFieldType());
            cf.setSortOrder(fr.getSortOrder() != 0 ? fr.getSortOrder() : i);
            if (fr.getFieldType() == FieldType.DROPDOWN && fr.getOptions() != null && !fr.getOptions().isEmpty()) {
                cf.setOptions(String.join(",", fr.getOptions()));
            }
            category.getFields().add(cf);
        }
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User " + username + " not found"));
    }
}
