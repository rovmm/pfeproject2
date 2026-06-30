package com.example.quizplatforme.Service;

public interface IGrokService {

    /**
     * Sends the given text to the Grok AI API and returns a French summary.
     *
     * @param text the extracted text content to summarize
     * @return the AI-generated summary in French
     */
    String summarize(String text);
}