package sk.uniba.fmph.dai.researcher.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import sk.uniba.fmph.dai.researcher.AbstractIntegrationTest;
import sk.uniba.fmph.dai.researcher.dtos.category.CategoryFieldRequest;
import sk.uniba.fmph.dai.researcher.dtos.category.CategoryRequest;
import sk.uniba.fmph.dai.researcher.dtos.category.CategoryResponse;
import sk.uniba.fmph.dai.researcher.entities.User;
import sk.uniba.fmph.dai.researcher.entities.category.FieldType;
import sk.uniba.fmph.dai.researcher.exceptions.ResourceNotFoundException;
import sk.uniba.fmph.dai.researcher.repositories.category.CategoryRepository;
import sk.uniba.fmph.dai.researcher.services.CategoryService;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CategoryServiceIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private CategoryRepository categoryRepository;

    private User owner;
    private User otherUser;

    @BeforeEach
    void setUp() {
        owner = createApprovedUser("owner");
        otherUser = createApprovedUser("other");
        authenticateAs(owner);
    }

    @Test
    void findAllReturnsOnlyCurrentUserCategories() {
        categoryService.create(categoryRequest("My Category"));
        authenticateAs(otherUser);
        categoryService.create(categoryRequest("Other Category"));
        authenticateAs(owner);

        List<CategoryResponse> result = categoryService.findAll();

        assertThat(result).extracting(CategoryResponse::getName).containsExactly("My Category");
    }

    @Test
    void findByIdReturnsCategoryWhenOwned() {
        CategoryResponse created = categoryService.create(categoryRequest("Research"));

        CategoryResponse found = categoryService.findById(created.getId());

        assertThat(found.getName()).isEqualTo("Research");
    }

    @Test
    void findByIdThrowsWhenNotOwned() {
        authenticateAs(otherUser);
        CategoryResponse otherCategory = categoryService.create(categoryRequest("Other"));
        authenticateAs(owner);

        assertThatThrownBy(() -> categoryService.findById(otherCategory.getId()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void findByIdThrowsWhenIdDoesNotExist() {
        assertThatThrownBy(() -> categoryService.findById(UUID.randomUUID()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createPersistsCategory() {
        CategoryRequest request = categoryRequest("Publications");
        request.setDescription("Academic publications");
        request.setIcon("book");

        CategoryResponse result = categoryService.create(request);

        assertThat(result.getId()).isNotNull();
        assertThat(result.getName()).isEqualTo("Publications");
        assertThat(result.getDescription()).isEqualTo("Academic publications");
        assertThat(result.getIcon()).isEqualTo("book");
        assertThat(result.isPredefined()).isFalse();
    }

    @Test
    void createUsesDefaultIconWhenNotProvided() {
        CategoryRequest request = new CategoryRequest();
        request.setName("No Icon");

        CategoryResponse result = categoryService.create(request);

        assertThat(result.getIcon()).isEqualTo("folder");
    }

    @Test
    void createPersistsCategoryWithFields() {
        CategoryFieldRequest field = new CategoryFieldRequest();
        field.setName("Status");
        field.setFieldType(FieldType.DROPDOWN);
        field.setOptions(List.of("Active", "Inactive"));

        CategoryRequest request = categoryRequest("Projects");
        request.setFields(List.of(field));

        CategoryResponse result = categoryService.create(request);

        assertThat(result.getFields()).hasSize(1);
        assertThat(result.getFields().get(0).getName()).isEqualTo("Status");
    }

    @Test
    void updateUpdatesNameAndDescription() {
        CategoryResponse created = categoryService.create(categoryRequest("Old Name"));

        CategoryRequest update = categoryRequest("New Name");
        update.setDescription("Updated description");
        CategoryResponse result = categoryService.update(created.getId(), update);

        assertThat(result.getName()).isEqualTo("New Name");
        assertThat(result.getDescription()).isEqualTo("Updated description");
    }

    @Test
    void updateThrowsWhenNotOwned() {
        authenticateAs(otherUser);
        CategoryResponse otherCategory = categoryService.create(categoryRequest("Other"));
        authenticateAs(owner);

        assertThatThrownBy(() -> categoryService.update(otherCategory.getId(), categoryRequest("Renamed")))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteRemovesCategory() {
        CategoryResponse created = categoryService.create(categoryRequest("ToDelete"));

        categoryService.delete(created.getId());

        assertThat(categoryRepository.findById(created.getId())).isEmpty();
    }

    @Test
    void deleteThrowsWhenNotOwned() {
        authenticateAs(otherUser);
        CategoryResponse otherCategory = categoryService.create(categoryRequest("Other"));
        authenticateAs(owner);

        assertThatThrownBy(() -> categoryService.delete(otherCategory.getId()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private CategoryRequest categoryRequest(String name) {
        CategoryRequest request = new CategoryRequest();
        request.setName(name);
        return request;
    }
}
