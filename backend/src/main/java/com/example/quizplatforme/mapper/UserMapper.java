package com.example.quizplatforme.mapper;
import com.example.quizplatforme.DTO.Response.UserResponse;
import com.example.quizplatforme.Model.Entity.User;
public class UserMapper {
    public static UserResponse toUserResponse(User user){
        if(user == null)
            return null;
        UserResponse UR = new UserResponse();
        UR.setId(user.getId());
        UR.setFullName(user.getFullName());
        UR.setEmail(user.getEmail());
        UR.setRole(user.getRole().name());
        UR.setPlan(user.getPlan().name());
        return UR;
    }
}



