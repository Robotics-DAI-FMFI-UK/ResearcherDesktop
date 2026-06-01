package sk.uniba.fmph.dai.researcher.services;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import sk.uniba.fmph.dai.researcher.repositories.UserRepository;
import sk.uniba.fmph.dai.researcher.exceptions.ResourceNotFoundException;
import sk.uniba.fmph.dai.researcher.entities.User;
import sk.uniba.fmph.dai.researcher.dtos.keywords.CreateKeywordRequest;
import sk.uniba.fmph.dai.researcher.dtos.keywords.KeywordResponse;

import java.util.List;
import java.util.UUID;
import sk.uniba.fmph.dai.researcher.entities.Keyword;
import sk.uniba.fmph.dai.researcher.repositories.KeywordRepository;

/**
 * Service for managing user-defined keywords (tags).
 *
 * <p>All operations are scoped to the currently authenticated user.</p>
 */
@Service
@Transactional
@RequiredArgsConstructor
public class KeywordService {

    private final KeywordRepository keywordRepository;
    private final UserRepository userRepository;

    /**
     * Returns all keywords belonging to the current user.
     *
     * @return list of keywords
     */
    public List<KeywordResponse> findAll() {
        User owner = getCurrentUser();
        return keywordRepository.findByOwner(owner).stream()
                .map(KeywordResponse::from)
                .toList();
    }

    /**
     * Creates a new keyword for the current user.
     *
     * <p>The keyword name is trimmed before being persisted.</p>
     *
     * @param request keyword name
     * @return the created keyword
     */
    public KeywordResponse create(CreateKeywordRequest request) {
        User owner = getCurrentUser();
        Keyword keyword = new Keyword();
        keyword.setName(request.getName().trim());
        keyword.setOwner(owner);
        return KeywordResponse.from(keywordRepository.save(keyword));
    }

    /**
     * Deletes a keyword owned by the current user.
     *
     * <p>The keyword is automatically disassociated from all research items
     * it was previously assigned to.</p>
     *
     * @param id keyword UUID
     * @throws ResourceNotFoundException if not found or not owned by the current user
     */
    public void delete(UUID id) {
        User owner = getCurrentUser();
        Keyword keyword = keywordRepository.findByIdAndOwner(id, owner)
                .orElseThrow(() -> new ResourceNotFoundException("Keyword", id));
        keywordRepository.delete(keyword);
    }

    /**
     * Deletes all keywords owned by the given user that are not assigned to any research item.
     *
     * @param owner the user whose orphan keywords should be removed
     */
    public void deleteOrphans(User owner) {
        List<Keyword> orphans = keywordRepository.findOrphansByOwner(owner);
        keywordRepository.deleteAll(orphans);
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User " + username + " not found"));
    }
}
