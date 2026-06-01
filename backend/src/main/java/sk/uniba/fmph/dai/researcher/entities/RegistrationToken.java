package sk.uniba.fmph.dai.researcher.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import sk.uniba.fmph.dai.researcher.entities.BaseEntity;
import sk.uniba.fmph.dai.researcher.entities.User;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "registration_tokens")
public class RegistrationToken extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private LocalDateTime expiresAt;
}
