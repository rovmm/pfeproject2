
package com.example.quizplatforme.Service;

import com.example.quizplatforme.DTO.Request.CodeRequest;
import com.example.quizplatforme.DTO.Response.CodeResponse;

/**
 * Interface définissant le contrat pour l'exécution du code.
 */
public interface CodeExecutionService {

    /**
     * Méthode principale pour exécuter le code soumis par un utilisateur.
     * * @param request le DTO contenant le code et le langage
     * @return un CodeResponse avec le résultat ou l'erreur
     */
    CodeResponse execute(CodeRequest request);
}
