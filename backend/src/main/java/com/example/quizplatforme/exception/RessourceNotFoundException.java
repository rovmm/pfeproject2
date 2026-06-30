package com.example.quizplatforme.exception;
import org.springframework.http.HttpStatus;

public class RessourceNotFoundException extends ApiException {
    public RessourceNotFoundException(String message){
        super(message, HttpStatus.NOT_FOUND);
    }
}
