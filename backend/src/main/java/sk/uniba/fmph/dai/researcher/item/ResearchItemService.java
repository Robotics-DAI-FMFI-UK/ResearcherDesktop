package sk.uniba.fmph.dai.researcher.item;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import sk.uniba.fmph.dai.researcher.auth.repository.UserRepository;
import sk.uniba.fmph.dai.researcher.category.Category;
import sk.uniba.fmph.dai.researcher.category.CategoryRepository;
import sk.uniba.fmph.dai.researcher.common.ResourceNotFoundException;
import sk.uniba.fmph.dai.researcher.common.entity.User;
import sk.uniba.fmph.dai.researcher.item.dto.RelatedItemResponse;
import sk.uniba.fmph.dai.researcher.item.dto.ResearchItemRequest;
import sk.uniba.fmph.dai.researcher.item.dto.ResearchItemResponse;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class ResearchItemService {

    private final ResearchItemRepository itemRepository;
    private final ResearchItemRelationRepository relationRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public List<ResearchItemResponse> findAll(UUID categoryId, String search) {
        User owner = getCurrentUser();

        List<ResearchItem> items;

        if (categoryId != null && search != null && !search.isBlank()) {
            categoryRepository.findByIdAndOwner(categoryId, owner)
                    .orElseThrow(() -> new ResourceNotFoundException("Category", categoryId));
            items = itemRepository.searchInCategory(owner.getId(), categoryId, search);
        } else if (categoryId != null) {
            Category category = categoryRepository.findByIdAndOwner(categoryId, owner)
                    .orElseThrow(() -> new ResourceNotFoundException("Category", categoryId));
            items = itemRepository.findByOwnerAndCategory(owner, category);
        } else if (search != null && !search.isBlank()) {
            items = itemRepository.search(owner.getId(), search);
        } else {
            items = itemRepository.findByOwner(owner);
        }

        return items.stream()
                .map(item -> ResearchItemResponse.from(item, getRelatedItems(item)))
                .toList();
    }

    public ResearchItemResponse findById(UUID id) {
        User owner = getCurrentUser();
        ResearchItem item = itemRepository.findByIdAndOwner(id, owner)
                .orElseThrow(() -> new ResourceNotFoundException("ResearchItem", id));
        return ResearchItemResponse.from(item, getRelatedItems(item));
    }

    public ResearchItemResponse create(ResearchItemRequest request) {
        User owner = getCurrentUser();
        ResearchItem item = new ResearchItem();
        applyRequest(item, request, owner);
        return ResearchItemResponse.from(itemRepository.save(item), List.of());
    }

    public ResearchItemResponse update(UUID id, ResearchItemRequest request) {
        User owner = getCurrentUser();
        ResearchItem item = itemRepository.findByIdAndOwner(id, owner)
                .orElseThrow(() -> new ResourceNotFoundException("ResearchItem", id));
        applyRequest(item, request, owner);
        return ResearchItemResponse.from(itemRepository.save(item), getRelatedItems(item));
    }

    public void delete(UUID id) {
        User owner = getCurrentUser();
        ResearchItem item = itemRepository.findByIdAndOwner(id, owner)
                .orElseThrow(() -> new ResourceNotFoundException("ResearchItem", id));
        fileStorageService.delete(item.getImagePath());
        fileStorageService.delete(item.getFilePath());
        itemRepository.delete(item);
    }

    public ResearchItemResponse uploadImage(UUID itemId, MultipartFile file) {
        User owner = getCurrentUser();
        ResearchItem item = itemRepository.findByIdAndOwner(itemId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("ResearchItem", itemId));
        fileStorageService.delete(item.getImagePath());
        String path = fileStorageService.upload(file, owner.getId().toString(), "images");
        item.setImagePath(path);
        return ResearchItemResponse.from(itemRepository.save(item), getRelatedItems(item));
    }

    public ResearchItemResponse uploadFile(UUID itemId, MultipartFile file) {
        User owner = getCurrentUser();
        ResearchItem item = itemRepository.findByIdAndOwner(itemId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("ResearchItem", itemId));
        fileStorageService.delete(item.getFilePath());
        String path = fileStorageService.upload(file, owner.getId().toString(), "files");
        item.setFilePath(path);
        item.setFileName(file.getOriginalFilename());
        return ResearchItemResponse.from(itemRepository.save(item), getRelatedItems(item));
    }

    @Transactional
    public void addRelation(UUID itemId, UUID targetId) {
        User owner = getCurrentUser();
        ResearchItem item = itemRepository.findByIdAndOwner(itemId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("ResearchItem", itemId));
        ResearchItem target = itemRepository.findByIdAndOwner(targetId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("ResearchItem", targetId));

        if (item.getId().equals(target.getId())) {
            throw new IllegalArgumentException("An item cannot be linked to itself");
        }
        if (relationRepository.existsLink(item, target)) {
            throw new IllegalStateException("Link already exists");
        }

        ResearchItemRelation relation = new ResearchItemRelation();
        relation.setSourceItem(item);
        relation.setTargetItem(target);
        relationRepository.save(relation);
    }

    @Transactional
    public void removeRelation(UUID itemId, UUID targetId) {
        User owner = getCurrentUser();
        ResearchItem item = itemRepository.findByIdAndOwner(itemId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("ResearchItem", itemId));
        ResearchItem target = itemRepository.findByIdAndOwner(targetId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("ResearchItem", targetId));
        relationRepository.deleteLink(item, target);
    }

    private void applyRequest(ResearchItem item, ResearchItemRequest request, User owner) {
        item.setTitle(request.getTitle());
        item.setDescription(request.getDescription());
        item.setDate(request.getDate());
        item.setOwner(owner);

        Category category = categoryRepository.findByIdAndOwner(request.getCategoryId(), owner)
                .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));
        item.setCategory(category);
    }

    private List<RelatedItemResponse> getRelatedItems(ResearchItem item) {
        return relationRepository.findAllByItem(item).stream()
                .map(r -> r.getSourceItem().getId().equals(item.getId())
                        ? RelatedItemResponse.from(r.getTargetItem())
                        : RelatedItemResponse.from(r.getSourceItem()))
                .toList();
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User " + username + " not found"));
    }
}
