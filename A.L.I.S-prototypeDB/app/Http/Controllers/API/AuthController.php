<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Http\Requests\RegisterBorrowerRequest;
use App\Http\Requests\RegisterLibrarianRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    // Public borrower signup (self-register)
    public function publicRegisterBorrower(RegisterBorrowerRequest $request)
    {
        try {
            $data = $request->validated();
            unset($data['confirm_password']);
            // rely on hashed cast
            $user = User::create($data);
            // Optional activity log with separate action type to avoid confusing librarian metrics
            \App\Models\ActivityLog::create([
                'user_id' => $user->id,
                'action_type' => 'SELF_REGISTER_BORROWER',
                'description' => 'Self-registered borrower user ID '.$user->id,
                'date_time' => now(),
            ]);
            // Auto-issue token for convenience
            $token = $user->createToken('api')->plainTextToken;
            Log::info('New borrower registered', ['user_id' => $user->id, 'email' => $user->email]);
            return response()->json(['token' => $token, 'user' => $user->load('role')], 201);
        } catch (\Exception $e) {
            Log::error('Registration error', ['error' => $e->getMessage(), 'email' => $request->email]);
            return response()->json(['message' => 'Registration failed'], 500);
        }
    }

    public function login(Request $request)
    {
        try {
            $data = $request->validate([
                'email' => ['required','email'],
                'password' => ['required','string'],
                'device_name' => ['nullable','string','max:100'],
            ]);

            $user = User::where('email', $data['email'])->with('role')->first();
            if (!$user || !Hash::check($data['password'], $user->password)) {
                Log::warning('Failed login attempt', ['email' => $data['email'], 'ip' => $request->ip()]);
                return response()->json(['message' => 'Invalid credentials'], 422);
            }

            $token = $user->createToken($data['device_name'] ?? 'api')->plainTextToken;
            Log::info('User logged in', ['user_id' => $user->id, 'email' => $user->email]);
            return response()->json(['token' => $token, 'user' => $user]);
        } catch (\Exception $e) {
            Log::error('Login error', ['error' => $e->getMessage(), 'email' => $data['email'] ?? null]);
            return response()->json(['message' => 'Login failed'], 500);
        }
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load('role'));
    }

    public function logout(Request $request)
    {
        $token = $request->user()->currentAccessToken();
        if ($token) {
            $request->user()->tokens()->where('id', $token->id)->delete();
        }
        return response()->noContent();
    }

    // Admin can register Librarian; Librarian/Admin can register Borrower
    public function registerBorrower(RegisterBorrowerRequest $request)
    {
        $actor = $request->user();
        if (!($actor->isAdmin() || $actor->isLibrarian())) {
            abort(403);
        }
        $data = $request->validated();
        unset($data['confirm_password']);
        // rely on hashed cast
        $user = User::create($data);
        // log librarian/admin action
        \App\Models\ActivityLog::create([
            'user_id' => $actor->id,
            'action_type' => 'REGISTER_BORROWER',
            'description' => 'Registered borrower user ID '.$user->id,
            'date_time' => now(),
        ]);
        return response()->json($user->load('role'), 201);
    }

    public function registerLibrarian(RegisterLibrarianRequest $request)
    {
        $actor = $request->user();
        if (!$actor->isAdmin()) {
            abort(403);
        }
        $data = $request->validated();
        unset($data['confirm_password']);
        // rely on hashed cast
        $user = User::create($data);
        // log admin action
        \App\Models\ActivityLog::create([
            'user_id' => $actor->id,
            'action_type' => 'REGISTER_LIBRARIAN',
            'description' => 'Registered librarian user ID '.$user->id,
            'date_time' => now(),
        ]);
        return response()->json($user->load('role'), 201);
    }
}
