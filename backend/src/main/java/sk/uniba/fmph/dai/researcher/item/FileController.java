package sk.uniba.fmph.dai.researcher.item;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

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
