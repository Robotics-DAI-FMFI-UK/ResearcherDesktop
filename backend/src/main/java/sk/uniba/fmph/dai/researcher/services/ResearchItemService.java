package sk.uniba.fmph.dai.researcher.services;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import sk.uniba.fmph.dai.researcher.repositories.UserRepository;
import sk.uniba.fmph.dai.researcher.entities.category.Category;
import sk.uniba.fmph.dai.researcher.entities.category.CategoryField;
import sk.uniba.fmph.dai.researcher.repositories.category.CategoryFieldRepository;
import sk.uniba.fmph.dai.researcher.repositories.category.CategoryRepository;
import sk.uniba.fmph.dai.researcher.entities.category.FieldType;
import sk.uniba.fmph.dai.researcher.exceptions.ResourceNotFoundException;
import sk.uniba.fmph.dai.researcher.entities.User;
import sk.uniba.fmph.dai.researcher.dtos.item.AddCommentRequest;
import sk.uniba.fmph.dai.researcher.dtos.item.AddLinkRequest;
import sk.uniba.fmph.dai.researcher.dtos.item.FieldValueRequest;
import sk.uniba.fmph.dai.researcher.dtos.item.ItemCommentResponse;
import sk.uniba.fmph.dai.researcher.dtos.item.ItemFieldValueResponse;
import sk.uniba.fmph.dai.researcher.dtos.item.ItemFileResponse;
import sk.uniba.fmph.dai.researcher.dtos.item.ItemLinkResponse;
import sk.uniba.fmph.dai.researcher.dtos.item.RelatedItemResponse;
import sk.uniba.fmph.dai.researcher.dtos.item.ResearchItemRequest;
import sk.uniba.fmph.dai.researcher.dtos.item.ResearchItemResponse;
import sk.uniba.fmph.dai.researcher.entities.Keyword;
import sk.uniba.fmph.dai.researcher.repositories.KeywordRepository;
import sk.uniba.fmph.dai.researcher.dtos.keywords.KeywordResponse;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import sk.uniba.fmph.dai.researcher.entities.item.ItemComment;
import sk.uniba.fmph.dai.researcher.entities.item.ItemFieldValue;
import sk.uniba.fmph.dai.researcher.entities.item.ItemFile;
import sk.uniba.fmph.dai.researcher.entities.item.ItemLink;
import sk.uniba.fmph.dai.researcher.entities.item.ResearchItem;
import sk.uniba.fmph.dai.researcher.entities.item.ResearchItemRelation;
import sk.uniba.fmph.dai.researcher.repositories.item.ItemCommentRepository;
import sk.uniba.fmph.dai.researcher.repositories.item.ItemFileRepository;
import sk.uniba.fmph.dai.researcher.repositories.item.ItemLinkRepository;
import sk.uniba.fmph.dai.researcher.repositories.item.ResearchItemRelationRepository;
import sk.uniba.fmph.dai.researcher.repositories.item.ResearchItemRepository;

/**
 * Service for managing research items and their associated data.
 *
 * <p>All operations are scoped to the currently authenticated user.
 * Provides CRUD for items, file and image management, bidirectional
 * relations, comments, external links, and keyword assignments.</p>
 */
@Service
@Transactional
@RequiredArgsConstructor
public class ResearchItemService {

    @PersistenceContext
    private EntityManager entityManager;

    private final ResearchItemRepository itemRepository;
    private final ResearchItemRelationRepository relationRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryFieldRepository categoryFieldRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final ItemFileRepository itemFileRepository;
    private final ItemCommentRepository commentRepository;
    private final ItemLinkRepository linkRepository;
    private final KeywordRepository keywordRepository;
    private final KeywordService keywordService;

    /**
     * Returns all research items for the current user with optional filtering.
     *
     * <p>Filtering is applied in order: category → text search → keyword operators.
     * Multiple keyword filter sets ({@code andIds}, {@code orIds}, {@code notIds}) are combined with AND logic.</p>
     *
     * @param categoryId  optional category filter
     * @param search      optional text search (title and description)
     * @param keywordIds  keyword UUIDs used with {@code keywordOp}
     * @param keywordOp   {@code AND}, {@code OR}, or {@code NOT} operator for {@code keywordIds}
     * @param andIds      items must contain ALL of these keywords
     * @param orIds       items must contain ANY of these keywords
     * @param notIds      items must contain NONE of these keywords
     * @return filtered list of items
     */
    public List<ResearchItemResponse> findAll(UUID categoryId, String search, List<UUID> keywordIds, String keywordOp,
                                              List<UUID> andIds, List<UUID> orIds, List<UUID> notIds) {
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

        if (keywordIds != null && !keywordIds.isEmpty()) {
            Set<UUID> kwSet = new HashSet<>(keywordIds);
            String op = keywordOp != null ? keywordOp.toUpperCase() : "AND";
            items = items.stream().filter(item -> {
                Set<UUID> itemKwIds = item.getKeywords().stream()
                        .map(Keyword::getId)
                        .collect(Collectors.toSet());
                return switch (op) {
                    case "OR" -> itemKwIds.stream().anyMatch(kwSet::contains);
                    case "NOT" -> itemKwIds.stream().noneMatch(kwSet::contains);
                    default -> kwSet.stream().allMatch(itemKwIds::contains);
                };
            }).toList();
        }

        if (andIds != null && !andIds.isEmpty()) {
            Set<UUID> andSet = new HashSet<>(andIds);
            items = items.stream().filter(item -> {
                Set<UUID> kws = item.getKeywords().stream().map(Keyword::getId).collect(Collectors.toSet());
                return kws.containsAll(andSet);
            }).toList();
        }

        if (orIds != null && !orIds.isEmpty()) {
            Set<UUID> orSet = new HashSet<>(orIds);
            items = items.stream().filter(item -> {
                Set<UUID> kws = item.getKeywords().stream().map(Keyword::getId).collect(Collectors.toSet());
                return orSet.stream().anyMatch(kws::contains);
            }).toList();
        }

        if (notIds != null && !notIds.isEmpty()) {
            Set<UUID> notSet = new HashSet<>(notIds);
            items = items.stream().filter(item -> {
                Set<UUID> kws = item.getKeywords().stream().map(Keyword::getId).collect(Collectors.toSet());
                return notSet.stream().noneMatch(kws::contains);
            }).toList();
        }

        return items.stream()
                .map(item -> ResearchItemResponse.from(item, getRelatedItems(item), List.of(), getItemFiles(item), List.of(), List.of(), getKeywords(item)))
                .toList();
    }

    /**
     * Returns a single research item with full details (field values, files, comments, links, keywords).
     *
     * @param id item UUID
     * @return full item response
     * @throws ResourceNotFoundException if not found or not owned by the current user
     */
    public ResearchItemResponse findById(UUID id) {
        User owner = getCurrentUser();
        ResearchItem item = itemRepository.findByIdAndOwner(id, owner)
                .orElseThrow(() -> new ResourceNotFoundException("ResearchItem", id));
        return ResearchItemResponse.from(item, getRelatedItems(item), buildFieldValues(item), getItemFiles(item), getComments(item), getLinks(item), getKeywords(item));
    }

    /**
     * Creates a new research item with field values and keyword assignments.
     *
     * @param request item data
     * @return the created item
     */
    public ResearchItemResponse create(ResearchItemRequest request) {
        User owner = getCurrentUser();
        ResearchItem item = new ResearchItem();
        applyRequest(item, request, owner);
        ResearchItem saved = itemRepository.save(item);
        return ResearchItemResponse.from(saved, List.of(), buildFieldValues(saved), getItemFiles(saved), List.of(), List.of(), getKeywords(saved));
    }

    /**
     * Updates an existing research item.
     *
     * @param id      item UUID
     * @param request updated data
     * @return the updated item
     * @throws ResourceNotFoundException if not found or not owned by the current user
     */
    public ResearchItemResponse update(UUID id, ResearchItemRequest request) {
        User owner = getCurrentUser();
        ResearchItem item = itemRepository.findByIdAndOwner(id, owner)
                .orElseThrow(() -> new ResourceNotFoundException("ResearchItem", id));
        applyRequest(item, request, owner);
        ResearchItem saved = itemRepository.save(item);
        keywordService.deleteOrphans(owner);
        return ResearchItemResponse.from(saved, getRelatedItems(saved), buildFieldValues(saved), getItemFiles(saved), getComments(saved), getLinks(saved), getKeywords(saved));
    }

    /**
     * Deletes a research item along with its image and all attached files.
     *
     * @param id item UUID
     * @throws ResourceNotFoundException if not found or not owned by the current user
     */
    public void delete(UUID id) {
        User owner = getCurrentUser();
        ResearchItem item = itemRepository.findByIdAndOwner(id, owner)
                .orElseThrow(() -> new ResourceNotFoundException("ResearchItem", id));
        fileStorageService.delete(item.getImagePath());
        for (ItemFile f : item.getItemFiles()) {
            fileStorageService.delete(f.getFilePath());
        }
        itemRepository.delete(item);
        keywordService.deleteOrphans(owner);
    }

    /**
     * Uploads or replaces the cover image of a research item.
     *
     * @param itemId item UUID
     * @param file   image file
     * @return updated item
     */
    public ResearchItemResponse uploadImage(UUID itemId, MultipartFile file) {
        User owner = getCurrentUser();
        ResearchItem item = itemRepository.findByIdAndOwner(itemId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("ResearchItem", itemId));
        fileStorageService.delete(item.getImagePath());
        String path = fileStorageService.upload(file, owner.getId().toString(), "images");
        item.setImagePath(path);
        ResearchItem saved = itemRepository.save(item);
        return ResearchItemResponse.from(saved, getRelatedItems(saved), buildFieldValues(saved), getItemFiles(saved), getComments(saved), getLinks(saved), getKeywords(saved));
    }

    /**
     * Attaches a file to a research item.
     *
     * @param itemId item UUID
     * @param file   file to attach
     * @return updated item
     */
    public ResearchItemResponse addFile(UUID itemId, MultipartFile file) {
        User owner = getCurrentUser();
        ResearchItem item = itemRepository.findByIdAndOwner(itemId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("ResearchItem", itemId));
        String path = fileStorageService.upload(file, owner.getId().toString(), "files");
        ItemFile itemFile = new ItemFile();
        itemFile.setItem(item);
        itemFile.setFilePath(path);
        itemFile.setFileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : path);
        item.getItemFiles().add(itemFile);
        ResearchItem saved = itemRepository.save(item);
        return ResearchItemResponse.from(saved, getRelatedItems(saved), buildFieldValues(saved), getItemFiles(saved), getComments(saved), getLinks(saved), getKeywords(saved));
    }

    /**
     * Removes an attached file from a research item and deletes it from storage.
     *
     * @param itemId item UUID
     * @param fileId file UUID
     * @return updated item
     */
    public ResearchItemResponse deleteFile(UUID itemId, UUID fileId) {
        User owner = getCurrentUser();
        ResearchItem item = itemRepository.findByIdAndOwner(itemId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("ResearchItem", itemId));
        ItemFile itemFile = itemFileRepository.findByIdAndItem(fileId, item)
                .orElseThrow(() -> new ResourceNotFoundException("ItemFile", fileId));
        fileStorageService.delete(itemFile.getFilePath());
        item.getItemFiles().remove(itemFile);
        itemFileRepository.delete(itemFile);
        ResearchItem saved = itemRepository.save(item);
        return ResearchItemResponse.from(saved, getRelatedItems(saved), buildFieldValues(saved), getItemFiles(saved), getComments(saved), getLinks(saved), getKeywords(saved));
    }

    /**
     * Creates a bidirectional relation between two research items.
     *
     * @param itemId   source item UUID
     * @param targetId target item UUID
     * @throws IllegalArgumentException if an item tries to link to itself
     * @throws IllegalStateException    if the relation already exists
     */
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

    /**
     * Removes the relation between two research items.
     *
     * @param itemId   source item UUID
     * @param targetId target item UUID
     */
    public void removeRelation(UUID itemId, UUID targetId) {
        User owner = getCurrentUser();
        ResearchItem item = itemRepository.findByIdAndOwner(itemId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("ResearchItem", itemId));
        ResearchItem target = itemRepository.findByIdAndOwner(targetId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("ResearchItem", targetId));
        relationRepository.deleteLink(item, target);
    }

    /**
     * Adds a comment to a research item.
     *
     * @param itemId  item UUID
     * @param request comment text
     * @return the created comment
     */
    public ItemCommentResponse addComment(UUID itemId, AddCommentRequest request) {
        User owner = getCurrentUser();
        ResearchItem item = itemRepository.findByIdAndOwner(itemId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("ResearchItem", itemId));
        ItemComment comment = new ItemComment();
        comment.setItem(item);
        comment.setText(request.getText());
        return ItemCommentResponse.from(commentRepository.save(comment));
    }

    /**
     * Updates the text of an existing comment on a research item.
     *
     * @param itemId    item UUID
     * @param commentId comment UUID
     * @param text      new comment text
     * @return the updated comment
     */
    public ItemCommentResponse updateComment(UUID itemId, UUID commentId, String text) {
        User owner = getCurrentUser();
        ResearchItem item = itemRepository.findByIdAndOwner(itemId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("ResearchItem", itemId));
        ItemComment comment = commentRepository.findByIdAndItem(commentId, item)
                .orElseThrow(() -> new ResourceNotFoundException("ItemComment", commentId));
        comment.setText(text);
        return ItemCommentResponse.from(commentRepository.save(comment));
    }

    /**
     * Deletes a comment from a research item.
     *
     * @param itemId    item UUID
     * @param commentId comment UUID
     */
    public void deleteComment(UUID itemId, UUID commentId) {
        User owner = getCurrentUser();
        ResearchItem item = itemRepository.findByIdAndOwner(itemId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("ResearchItem", itemId));
        ItemComment comment = commentRepository.findByIdAndItem(commentId, item)
                .orElseThrow(() -> new ResourceNotFoundException("ItemComment", commentId));
        commentRepository.delete(comment);
    }

    /**
     * Adds an external link to a research item.
     *
     * @param itemId  item UUID
     * @param request link URL, name and optional description
     * @return the created link
     */
    public ItemLinkResponse addLink(UUID itemId, AddLinkRequest request) {
        User owner = getCurrentUser();
        ResearchItem item = itemRepository.findByIdAndOwner(itemId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("ResearchItem", itemId));
        ItemLink link = new ItemLink();
        link.setItem(item);
        link.setUrl(request.getUrl());
        link.setName(request.getName());
        link.setDescription(request.getDescription());
        return ItemLinkResponse.from(linkRepository.save(link));
    }

    /**
     * Removes an external link from a research item.
     *
     * @param itemId item UUID
     * @param linkId link UUID
     */
    public void deleteLink(UUID itemId, UUID linkId) {
        User owner = getCurrentUser();
        ResearchItem item = itemRepository.findByIdAndOwner(itemId, owner)
                .orElseThrow(() -> new ResourceNotFoundException("ResearchItem", itemId));
        ItemLink link = linkRepository.findByIdAndItem(linkId, item)
                .orElseThrow(() -> new ResourceNotFoundException("ItemLink", linkId));
        linkRepository.delete(link);
    }

    private void applyRequest(ResearchItem item, ResearchItemRequest request, User owner) {
        item.setTitle(request.getTitle());
        item.setDate(request.getDate());
        item.setOwner(owner);

        Category category = categoryRepository.findByIdAndOwner(request.getCategoryId(), owner)
                .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));
        item.setCategory(category);

        applyFieldValues(item, request.getFieldValues());
        applyKeywords(item, request.getKeywordIds(), owner);
    }

    private void applyFieldValues(ResearchItem item, List<FieldValueRequest> fieldValueRequests) {
        item.getFieldValues().clear();
        entityManager.flush();
        if (fieldValueRequests == null || fieldValueRequests.isEmpty()) {
            return;
        }
        for (FieldValueRequest fr : fieldValueRequests) {
            if (fr.getFieldId() == null) {
                continue;
            }
            CategoryField field = categoryFieldRepository.findById(fr.getFieldId())
                    .orElseThrow(() -> new ResourceNotFoundException("CategoryField", fr.getFieldId()));
            ItemFieldValue fv = new ItemFieldValue();
            fv.setItem(item);
            fv.setField(field);
            fv.setValue(fr.getValue());
            item.getFieldValues().add(fv);
        }
    }

    private List<ItemFieldValueResponse> buildFieldValues(ResearchItem item) {
        List<CategoryField> fields = item.getCategory().getFields();
        if (fields.isEmpty()) {
            return List.of();
        }
        Map<UUID, String> valueMap = item.getFieldValues().stream()
                .collect(Collectors.toMap(fv -> fv.getField().getId(), fv -> fv.getValue() != null ? fv.getValue() : ""));
        return fields.stream()
                .map(f -> {
                    List<String> options = List.of();
                    if (f.getFieldType() == FieldType.DROPDOWN && f.getOptions() != null) {
                        options = Arrays.stream(f.getOptions().split(","))
                                .map(String::trim)
                                .filter(s -> !s.isEmpty())
                                .toList();
                    }
                    return new ItemFieldValueResponse(f.getId(), f.getName(), f.getFieldType(), options, valueMap.get(f.getId()));
                })
                .toList();
    }

    private List<ItemFileResponse> getItemFiles(ResearchItem item) {
        return item.getItemFiles().stream()
                .map(ItemFileResponse::from)
                .toList();
    }

    private List<ItemCommentResponse> getComments(ResearchItem item) {
        return item.getComments().stream()
                .map(ItemCommentResponse::from)
                .toList();
    }

    private List<ItemLinkResponse> getLinks(ResearchItem item) {
        return item.getLinks().stream()
                .map(ItemLinkResponse::from)
                .toList();
    }

    private void applyKeywords(ResearchItem item, List<UUID> keywordIds, User owner) {
        item.getKeywords().clear();
        if (keywordIds == null || keywordIds.isEmpty()) { return; }
        List<Keyword> kws = keywordRepository.findAllByIdInAndOwner(keywordIds, owner);
        item.getKeywords().addAll(kws);
    }

    private List<KeywordResponse> getKeywords(ResearchItem item) {
        return item.getKeywords().stream()
                .map(KeywordResponse::from)
                .toList();
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
