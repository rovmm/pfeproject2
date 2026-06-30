package com.example.quizplatforme.exception;
import org.springframework.http.HttpStatus;

public class UnauthrizedException extends ApiException {
    public UnauthrizedException(String message) {
        super(message, HttpStatus.UNAUTHORIZED);
    }
}
