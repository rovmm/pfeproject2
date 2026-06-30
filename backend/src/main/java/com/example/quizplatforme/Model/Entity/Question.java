package com.example.quizplatforme.Model.Entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(name = "question_text", columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @Column(name = "option_a", length = 500, nullable = false)
    private String optionA;

    @Column(name = "option_b", length = 500, nullable = false)
    private String optionB;

    @Column(name = "option_c", length = 500, nullable = false)
    private String optionC;

    @Column(name = "option_d", length = 500, nullable = false)
    private String optionD;

    @Column(name = "correct_option", columnDefinition = "CHAR(1)", nullable = false)
    private String correctOption;

    @Column(nullable = false)
    @Builder.Default
    private int position = 0;
}
