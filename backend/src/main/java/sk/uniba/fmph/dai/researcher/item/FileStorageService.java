package sk.uniba.fmph.dai.researcher.item;

import com.jcraft.jsch.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import sk.uniba.fmph.dai.researcher.config.SftpProperties;

import java.io.ByteArrayOutputStream;
import java.net.URLConnection;
import java.util.Properties;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final SftpProperties props;

    public String upload(MultipartFile file, String ownerId, String type) {
        String original = file.getOriginalFilename();
        String ext = (original != null && original.contains("."))
                ? original.substring(original.lastIndexOf('.'))
                : "";
        String filename = UUID.randomUUID() + ext;
        String remoteDir = props.getBasePath() + "/" + ownerId + "/" + type;
        String remotePath = remoteDir + "/" + filename;

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

        return ownerId + "/" + type + "/" + filename;
    }

    public byte[] download(String relativePath) {
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

    public void delete(String relativePath) {
        if (relativePath == null) return;
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

    public String detectContentType(String filename) {
        String ct = URLConnection.guessContentTypeFromName(filename);
        return ct != null ? ct : "application/octet-stream";
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
