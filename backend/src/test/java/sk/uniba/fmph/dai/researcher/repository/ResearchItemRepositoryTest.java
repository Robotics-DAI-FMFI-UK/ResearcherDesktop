package sk.uniba.fmph.dai.researcher.repository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import sk.uniba.fmph.dai.researcher.AbstractIntegrationTest;
import sk.uniba.fmph.dai.researcher.entities.User;
import sk.uniba.fmph.dai.researcher.entities.category.Category;
import sk.uniba.fmph.dai.researcher.entities.item.ResearchItem;
import sk.uniba.fmph.dai.researcher.repositories.category.CategoryRepository;
import sk.uniba.fmph.dai.researcher.repositories.item.ResearchItemRepository;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ResearchItemRepositoryTest extends AbstractIntegrationTest {

    @Autowired
    private ResearchItemRepository itemRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private User owner;
    private Category category;

    @BeforeEach
    void setUp() {
        owner = createApprovedUser("repouser");
        category = createCategory("Research", owner);
    }

    @Test
    void searchFindsByTitleFullText() {
        saveItem("Machine Learning Fundamentals", owner, category);
        saveItem("Deep Learning Architectures", owner, category);
        saveItem("Classical Algorithms", owner, category);

        List<ResearchItem> results = itemRepository.search(owner.getId(), "machine learning");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getTitle()).isEqualTo("Machine Learning Fundamentals");
    }

    @Test
    void searchReturnsEmptyWhenNoMatch() {
        saveItem("Java Programming", owner, category);

        List<ResearchItem> results = itemRepository.search(owner.getId(), "quantum physics");

        assertThat(results).isEmpty();
    }

    @Test
    void searchDoesNotReturnOtherUsersItems() {
        User otherUser = createApprovedUser("otherrepouser");
        Category otherCategory = createCategory("Other", otherUser);
        saveItem("Machine Learning Guide", otherUser, otherCategory);

        List<ResearchItem> results = itemRepository.search(owner.getId(), "machine learning");

        assertThat(results).isEmpty();
    }

    @Test
    void searchInCategoryFiltersCorrectly() {
        Category secondCategory = createCategory("Books", owner);
        saveItem("Neural Networks Paper", owner, category);
        saveItem("Neural Networks Book", owner, secondCategory);

        List<ResearchItem> results = itemRepository.searchInCategory(
                owner.getId(), category.getId(), "neural networks");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getTitle()).isEqualTo("Neural Networks Paper");
    }

    @Test
    void countByOwnerGroupedByCategoryReturnsCorrectCounts() {
        Category secondCategory = createCategory("Books", owner);
        saveItem("Item 1", owner, category);
        saveItem("Item 2", owner, category);
        saveItem("Item 3", owner, secondCategory);

        List<Object[]> counts = itemRepository.countByOwnerGroupedByCategory(owner);

        assertThat(counts).hasSize(2);
        long researchCount = counts.stream()
                .filter(row -> row[0].equals(category.getId()))
                .mapToLong(row -> (Long) row[1])
                .sum();
        assertThat(researchCount).isEqualTo(2);
    }

    @Test
    void findByOwnerAndCategoryReturnsCorrectItems() {
        Category secondCategory = createCategory("Books", owner);
        saveItem("Paper 1", owner, category);
        saveItem("Paper 2", owner, category);
        saveItem("Book 1", owner, secondCategory);

        List<ResearchItem> results = itemRepository.findByOwnerAndCategory(owner, category);

        assertThat(results).hasSize(2);
        assertThat(results).extracting(ResearchItem::getTitle)
                .containsExactlyInAnyOrder("Paper 1", "Paper 2");
    }


    private ResearchItem saveItem(String title, User user, Category cat) {
        ResearchItem item = new ResearchItem();
        item.setTitle(title);
        item.setOwner(user);
        item.setCategory(cat);
        return itemRepository.save(item);
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
