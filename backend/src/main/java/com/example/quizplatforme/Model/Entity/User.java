package com.example.quizplatforme.Model.Entity;


import com.example.quizplatforme.Model.Enum.PlanEnum;
import com.example.quizplatforme.Model.Enum.RoleEnum;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    @Column(name="full_name",length = 100,nullable = false)
    private String fullName;

    @NotBlank
    @Size(max = 100)
    @Email
    @Column(length = 100,nullable = false,unique = true)
    private String email;

    @NotBlank
    @Size(min = 8,max = 100)
    private String password ;

    @Enumerated(EnumType.STRING)

    @Column(length = 20,nullable = false)
    private RoleEnum role = RoleEnum.PROF ;

    @Enumerated(EnumType.STRING)
    @Column(length = 20,nullable = false )
    private PlanEnum plan = PlanEnum.FREE;

    @Column(length = 100,name = "strip_customer_id")
    private String stripCustomerId;

    @Column(name = "created_at",updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    public void onCreate(){
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    @PreUpdate
    public void onUpdate(){
        this.updatedAt = LocalDateTime.now();
    }

}
