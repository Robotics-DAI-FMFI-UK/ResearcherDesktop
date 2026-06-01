package sk.uniba.fmph.dai.researcher.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import sk.uniba.fmph.dai.researcher.AbstractIntegrationTest;
import sk.uniba.fmph.dai.researcher.dtos.item.AddCommentRequest;
import sk.uniba.fmph.dai.researcher.dtos.item.AddLinkRequest;
import sk.uniba.fmph.dai.researcher.dtos.item.ItemCommentResponse;
import sk.uniba.fmph.dai.researcher.dtos.item.ItemLinkResponse;
import sk.uniba.fmph.dai.researcher.dtos.item.ResearchItemRequest;
import sk.uniba.fmph.dai.researcher.dtos.item.ResearchItemResponse;
import sk.uniba.fmph.dai.researcher.entities.User;
import sk.uniba.fmph.dai.researcher.entities.category.Category;
import sk.uniba.fmph.dai.researcher.exceptions.ResourceNotFoundException;
import sk.uniba.fmph.dai.researcher.repositories.category.CategoryRepository;
import sk.uniba.fmph.dai.researcher.repositories.item.ResearchItemRepository;
import sk.uniba.fmph.dai.researcher.services.ResearchItemService;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ResearchItemServiceIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private ResearchItemService itemService;

    @Autowired
    private ResearchItemRepository itemRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private User owner;
    private User otherUser;
    private Category category;

    @BeforeEach
    void setUp() {
        owner = createApprovedUser("owner");
        otherUser = createApprovedUser("other");
        category = createCategory("Research", owner);
        authenticateAs(owner);
    }

    @Test
    void createPersistsItem() {
        ResearchItemRequest request = itemRequest("My Paper", category.getId());

        ResearchItemResponse result = itemService.create(request);

        assertThat(result.getId()).isNotNull();
        assertThat(result.getTitle()).isEqualTo("My Paper");
        assertThat(result.getCategoryId()).isEqualTo(category.getId());
    }

    @Test
    void findByIdReturnsFullItemWhenOwned() {
        ResearchItemResponse created = itemService.create(itemRequest("Paper A", category.getId()));

        ResearchItemResponse found = itemService.findById(created.getId());

        assertThat(found.getId()).isEqualTo(created.getId());
        assertThat(found.getTitle()).isEqualTo("Paper A");
    }

    @Test
    void findByIdThrowsWhenNotOwned() {
        authenticateAs(otherUser);
        Category otherCategory = createCategory("Other", otherUser);
        ResearchItemResponse otherItem = itemService.create(itemRequest("Other Paper", otherCategory.getId()));
        authenticateAs(owner);

        assertThatThrownBy(() -> itemService.findById(otherItem.getId()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void findByIdThrowsWhenIdDoesNotExist() {
        assertThatThrownBy(() -> itemService.findById(UUID.randomUUID()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void findAllReturnsOnlyOwnerItems() {
        itemService.create(itemRequest("Paper 1", category.getId()));
        itemService.create(itemRequest("Paper 2", category.getId()));
        authenticateAs(otherUser);
        Category otherCategory = createCategory("Other", otherUser);
        itemService.create(itemRequest("Other Paper", otherCategory.getId()));
        authenticateAs(owner);

        List<ResearchItemResponse> result = itemService.findAll(null, null, null, null, null, null, null);

        assertThat(result).hasSize(2);
        assertThat(result).extracting(ResearchItemResponse::getTitle)
                .containsExactlyInAnyOrder("Paper 1", "Paper 2");
    }

    @Test
    void findAllFiltersByCategory() {
        Category secondCategory = createCategory("Other Category", owner);
        itemService.create(itemRequest("In Research", category.getId()));
        itemService.create(itemRequest("In Other", secondCategory.getId()));

        List<ResearchItemResponse> result = itemService.findAll(category.getId(), null, null, null, null, null, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("In Research");
    }

    @Test
    void updateUpdatesItem() {
        ResearchItemResponse created = itemService.create(itemRequest("Old Title", category.getId()));
        ResearchItemRequest update = itemRequest("New Title", category.getId());
        update.setDate(LocalDate.of(2025, 1, 15));

        ResearchItemResponse result = itemService.update(created.getId(), update);

        assertThat(result.getTitle()).isEqualTo("New Title");
        assertThat(result.getDate()).isEqualTo(LocalDate.of(2025, 1, 15));
    }

    @Test
    void updateThrowsWhenNotOwned() {
        authenticateAs(otherUser);
        Category otherCategory = createCategory("Other", otherUser);
        ResearchItemResponse otherItem = itemService.create(itemRequest("Other Paper", otherCategory.getId()));
        authenticateAs(owner);

        assertThatThrownBy(() -> itemService.update(otherItem.getId(), itemRequest("Hacked", category.getId())))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteRemovesItem() {
        ResearchItemResponse created = itemService.create(itemRequest("ToDelete", category.getId()));

        itemService.delete(created.getId());

        assertThat(itemRepository.findById(created.getId())).isEmpty();
    }

    @Test
    void addCommentAddsCommentToItem() {
        ResearchItemResponse item = itemService.create(itemRequest("Paper", category.getId()));
        AddCommentRequest commentRequest = new AddCommentRequest();
        commentRequest.setText("Great paper!");

        ItemCommentResponse comment = itemService.addComment(item.getId(), commentRequest);

        assertThat(comment.getId()).isNotNull();
        assertThat(comment.getText()).isEqualTo("Great paper!");
    }

    @Test
    void deleteCommentRemovesComment() {
        ResearchItemResponse item = itemService.create(itemRequest("Paper", category.getId()));
        AddCommentRequest commentRequest = new AddCommentRequest();
        commentRequest.setText("To be deleted");
        ItemCommentResponse comment = itemService.addComment(item.getId(), commentRequest);

        itemService.deleteComment(item.getId(), comment.getId());

        ResearchItemResponse updated = itemService.findById(item.getId());
        assertThat(updated.getComments()).isEmpty();
    }

    @Test
    void addLinkAddsLinkToItem() {
        ResearchItemResponse item = itemService.create(itemRequest("Paper", category.getId()));
        AddLinkRequest linkRequest = new AddLinkRequest();
        linkRequest.setUrl("https://example.com/paper");
        linkRequest.setName("Example");

        ItemLinkResponse link = itemService.addLink(item.getId(), linkRequest);

        assertThat(link.getId()).isNotNull();
        assertThat(link.getUrl()).isEqualTo("https://example.com/paper");
    }

    @Test
    void deleteLinkRemovesLink() {
        ResearchItemResponse item = itemService.create(itemRequest("Paper", category.getId()));
        AddLinkRequest linkRequest = new AddLinkRequest();
        linkRequest.setUrl("https://example.com");
        linkRequest.setName("Link");
        ItemLinkResponse link = itemService.addLink(item.getId(), linkRequest);

        itemService.deleteLink(item.getId(), link.getId());

        ResearchItemResponse updated = itemService.findById(item.getId());
        assertThat(updated.getLinks()).isEmpty();
    }

    @Test
    void addRelationCreatesBidirectionalRelation() {
        ResearchItemResponse item1 = itemService.create(itemRequest("Paper A", category.getId()));
        ResearchItemResponse item2 = itemService.create(itemRequest("Paper B", category.getId()));

        itemService.addRelation(item1.getId(), item2.getId());

        ResearchItemResponse found1 = itemService.findById(item1.getId());
        assertThat(found1.getRelatedItems()).hasSize(1);
        assertThat(found1.getRelatedItems().get(0).getId()).isEqualTo(item2.getId());
    }

    @Test
    void addRelationThrowsWhenSelfLink() {
        ResearchItemResponse item = itemService.create(itemRequest("Paper", category.getId()));

        assertThatThrownBy(() -> itemService.addRelation(item.getId(), item.getId()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot be linked to itself");
    }

    @Test
    void addRelationThrowsWhenAlreadyExists() {
        ResearchItemResponse item1 = itemService.create(itemRequest("Paper A", category.getId()));
        ResearchItemResponse item2 = itemService.create(itemRequest("Paper B", category.getId()));
        itemService.addRelation(item1.getId(), item2.getId());

        assertThatThrownBy(() -> itemService.addRelation(item1.getId(), item2.getId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already exists");
    }


    private ResearchItemRequest itemRequest(String title, UUID categoryId) {
        ResearchItemRequest request = new ResearchItemRequest();
        request.setTitle(title);
        request.setCategoryId(categoryId);
        return request;
    }

    private Category createCategory(String name, User user) {
        Category cat = new Category();
        cat.setName(name);
        cat.setIcon("folder");
        cat.setPredefined(false);
        cat.setOwner(user);
        return categoryRepository.save(cat);
    }
}
