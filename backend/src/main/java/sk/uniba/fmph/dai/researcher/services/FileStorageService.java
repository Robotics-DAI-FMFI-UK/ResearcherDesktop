package sk.uniba.fmph.dai.researcher.services;

import com.jcraft.jsch.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import sk.uniba.fmph.dai.researcher.config.SftpProperties;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URLConnection;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Properties;
import java.util.UUID;

/**
 * Service for storing and retrieving files associated with research items.
 *
 * <p>Supports two storage backends selected at startup based on configuration:</p>
 * <ul>
 *   <li><b>Local filesystem</b> — used when {@code sftp.host} is not configured.
 *       Files are stored relative to {@code sftp.local-base-path}.</li>
 *   <li><b>SFTP</b> — used when {@code sftp.host} is set.
 *       Files are transferred to the configured remote server.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final SftpProperties props;

    /**
     * Uploads a file and returns its relative storage path.
     *
     * <p>The file is stored under {@code {ownerId}/{type}/{uuid}{ext}}.</p>
     *
     * @param file    multipart file to upload
     * @param ownerId UUID of the owning user
     * @param type    storage category (e.g. {@code image} or {@code file})
     * @return relative path of the stored file
     */
    public String upload(MultipartFile file, String ownerId, String type) {
        String original = file.getOriginalFilename();
        String ext = (original != null && original.contains("."))
                ? original.substring(original.lastIndexOf('.'))
                : "";
        String filename = UUID.randomUUID() + ext;
        String relativePath = ownerId + "/" + type + "/" + filename;

        if (isLocal()) {
            localUpload(file, relativePath);
        } else {
            sftpUpload(file, relativePath);
        }

        return relativePath;
    }

    /**
     * Downloads a file by its relative storage path.
     *
     * @param relativePath path returned by {@link #upload}
     * @return file contents as a byte array
     * @throws IllegalStateException if the download fails
     */
    public byte[] download(String relativePath) {
        if (isLocal()) {
            return localDownload(relativePath);
        }
        return sftpDownload(relativePath);
    }

    /**
     * Deletes a file from storage. Does nothing if the path is {@code null}.
     *
     * @param relativePath path returned by {@link #upload}, or {@code null}
     */
    public void delete(String relativePath) {
        if (relativePath == null) {
            return;
        }
        if (isLocal()) {
            localDelete(relativePath);
        } else {
            sftpDelete(relativePath);
        }
    }

    /**
     * Detects the MIME content type from a filename extension.
     *
     * @param filename file name including extension
     * @return MIME type string, or {@code application/octet-stream} if unknown
     */
    public String detectContentType(String filename) {
        String ct = URLConnection.guessContentTypeFromName(filename);
        return ct != null ? ct : "application/octet-stream";
    }

    private boolean isLocal() {
        return props.getHost() == null || props.getHost().isBlank();
    }

    private void localUpload(MultipartFile file, String relativePath) {
        Path target = Paths.get(props.getLocalBasePath(), relativePath);
        try {
            Files.createDirectories(target.getParent());
            Files.write(target, file.getBytes());
        } catch (IOException e) {
            throw new IllegalStateException("Local file upload failed: " + e.getMessage(), e);
        }
    }

    private byte[] localDownload(String relativePath) {
        Path target = Paths.get(props.getLocalBasePath(), relativePath);
        try {
            return Files.readAllBytes(target);
        } catch (IOException e) {
            throw new IllegalStateException("Local file download failed: " + e.getMessage(), e);
        }
    }

    private void localDelete(String relativePath) {
        Path target = Paths.get(props.getLocalBasePath(), relativePath);
        try {
            Files.deleteIfExists(target);
        } catch (IOException e) {
            throw new IllegalStateException("Local file delete failed: " + e.getMessage(), e);
        }
    }

    private void sftpUpload(MultipartFile file, String relativePath) {
        String remoteDir = props.getBasePath() + "/" + relativePath.substring(0, relativePath.lastIndexOf('/'));
        String remotePath = props.getBasePath() + "/" + relativePath;

        Session session = null;
        ChannelSftp channel = null;
        try {
            session = openSession();
            channel = openSftpChannel(session);
            mkdirs(channel, remoteDir);
            channel.put(file.getInputStream(), remotePath);
        } catch (Exception e) {
            throw new IllegalStateException("File upload failed: " + e.getMessage(), e);
        } finally {
            disconnect(channel, session);
        }
    }

    private byte[] sftpDownload(String relativePath) {
        String remotePath = props.getBasePath() + "/" + relativePath;
        Session session = null;
        ChannelSftp channel = null;
        try {
            session = openSession();
            channel = openSftpChannel(session);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            channel.get(remotePath, out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("File download failed: " + e.getMessage(), e);
        } finally {
            disconnect(channel, session);
        }
    }

    private void sftpDelete(String relativePath) {
        String remotePath = props.getBasePath() + "/" + relativePath;
        Session session = null;
        ChannelSftp channel = null;
        try {
            session = openSession();
            channel = openSftpChannel(session);
            channel.rm(remotePath);
        } catch (SftpException e) {
            if (e.id != ChannelSftp.SSH_FX_NO_SUCH_FILE) {
                throw new IllegalStateException("File delete failed: " + e.getMessage(), e);
            }
        } catch (Exception e) {
            throw new IllegalStateException("File delete failed: " + e.getMessage(), e);
        } finally {
            disconnect(channel, session);
        }
    }

    private Session openSession() throws JSchException {
        JSch jsch = new JSch();
        Session session = jsch.getSession(props.getUsername(), props.getHost(), props.getPort());
        session.setPassword(props.getPassword());
        Properties config = new Properties();
        config.put("StrictHostKeyChecking", "no");
        session.setConfig(config);
        session.connect(15_000);
        return session;
    }

    private ChannelSftp openSftpChannel(Session session) throws JSchException {
        ChannelSftp channel = (ChannelSftp) session.openChannel("sftp");
        channel.connect(10_000);
        return channel;
    }

    private void mkdirs(ChannelSftp channel, String path) {
        StringBuilder current = new StringBuilder();
        for (String part : path.split("/")) {
            if (part.isEmpty()) {
                current.append("/");
                continue;
            }
            current.append(part);
            try {
                channel.mkdir(current.toString());
            } catch (SftpException ignored) {
            }
            current.append("/");
        }
    }

    private void disconnect(ChannelSftp channel, Session session) {
        if (channel != null && channel.isConnected()) channel.disconnect();
        if (session != null && session.isConnected()) session.disconnect();
    }
}
