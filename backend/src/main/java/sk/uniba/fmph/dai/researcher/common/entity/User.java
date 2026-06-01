package sk.uniba.fmph.dai.researcher.common.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Mode mode = Mode.BASIC;

    public enum Role {
        ADMIN, USER
    }

    public enum Mode {
        BASIC, EXTENDED, ADVANCED
    }
}