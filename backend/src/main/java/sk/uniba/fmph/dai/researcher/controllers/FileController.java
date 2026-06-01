package sk.uniba.fmph.dai.researcher.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sk.uniba.fmph.dai.researcher.services.FileStorageService;

/**
 * REST controller for serving stored files.
 *
 * <p>Provides download access to files and images associated with research items.
 * Files are retrieved from either the local filesystem or SFTP storage depending
 * on the active configuration.</p>
 *
 * <p>Base path: {@code /api/files}</p>
 */
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

    /**
     * Downloads a file by its storage path components.
     *
     * <p>The content type is detected automatically from the file extension.</p>
     *
     * @param userId   UUID of the file owner
     * @param type     file category (e.g. {@code image} or {@code file})
     * @param filename stored filename (UUID-based)
     * @return file bytes with the appropriate {@code Content-Type} header,
     *         or {@code 404} if the file does not exist
     */
    @GetMapping("/{userId}/{type}/{filename}")
    public ResponseEntity<byte[]> download(
            @PathVariable String userId,
            @PathVariable String type,
            @PathVariable String filename) {
        String relativePath = userId + "/" + type + "/" + filename;
        try {
            byte[] data = fileStorageService.download(relativePath);
            String contentType = fileStorageService.detectContentType(filename);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .body(data);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
