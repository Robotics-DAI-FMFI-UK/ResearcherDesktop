package sk.uniba.fmph.dai.researcher.category;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import sk.uniba.fmph.dai.researcher.auth.repository.UserRepository;
import sk.uniba.fmph.dai.researcher.category.dto.CategoryRequest;
import sk.uniba.fmph.dai.researcher.category.dto.CategoryResponse;
import sk.uniba.fmph.dai.researcher.common.ResourceNotFoundException;
import sk.uniba.fmph.dai.researcher.common.entity.User;
import sk.uniba.fmph.dai.researcher.item.ResearchItemRepository;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ResearchItemRepository researchItemRepository;

    public List<CategoryResponse> findAll() {
        User currentUser = getCurrentUser();
        Map<UUID, Long> countMap = researchItemRepository.countByOwnerGroupedByCategory(currentUser)
                .stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (Long) row[1]));
        return categoryRepository.findByOwner(currentUser).stream()
                .map(c -> CategoryResponse.from(c, countMap.getOrDefault(c.getId(), 0L)))
                .toList();
    }

    public CategoryResponse findById(UUID id) {
        User currentUser = getCurrentUser();
        return categoryRepository.findByIdAndOwner(id, currentUser)
                .map(CategoryResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
    }

    public CategoryResponse create(CategoryRequest request) {
        User currentUser = getCurrentUser();
        requireExtended(currentUser);
        Category category = new Category();
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setIcon(request.getIcon() != null ? request.getIcon() : "folder");
        category.setPredefined(false);
        category.setOwner(currentUser);
        return CategoryResponse.from(categoryRepository.save(category));
    }

    public CategoryResponse update(UUID id, CategoryRequest request) {
        User currentUser = getCurrentUser();
        requireExtended(currentUser);
        Category category = categoryRepository.findByIdAndOwner(id, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        if (request.getIcon() != null) category.setIcon(request.getIcon());
        return CategoryResponse.from(categoryRepository.save(category));
    }

    public void delete(UUID id) {
        User currentUser = getCurrentUser();
        requireExtended(currentUser);
        Category category = categoryRepository.findByIdAndOwner(id, currentUser)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        categoryRepository.delete(category);
    }

    private void requireExtended(User user) {
        if (user.getMode() == User.Mode.BASIC) {
            throw new IllegalStateException("This action requires Extended mode or higher");
        }
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User " + username + " not found"));
    }
}
