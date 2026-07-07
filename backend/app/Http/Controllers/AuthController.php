<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request) {
        $request->validate([
            "email"=> "required|string|email|min:3|max:255",
            "password"=> "required|string|min:6|max:255",
        ]);

        $user = User::where("email", $request->email)->first();
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                "message"=> "Invalid credentials",
            ], 401);
        }

        $token = $user->createToken("authToken")->plainTextToken;

        return response()->json([
            "message"=> "Login successful",
            "token"=> $token,
            "user"=> $user->only(["id", "name", "email", "role"]),
        ], 200);
    }

    public function logout (Request $request) {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            "message"=> "Logout successful",
        ], 200);
    }

}
