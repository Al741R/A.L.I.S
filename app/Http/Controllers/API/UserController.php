<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->get('q',''));
        $roleId = $request->get('role_id');

        $users = User::query()
            ->with('role')
            ->when($q !== '', function ($s) use ($q) {
                $s->where(function ($x) use ($q) {
                    $x->where('first_name','like',"%{$q}%")
                      ->orWhere('last_name','like',"%{$q}%")
                      ->orWhere('email','like',"%{$q}%");
                });
            })
            ->when($roleId, fn($s) => $s->where('role_id', $roleId))
            ->orderBy('last_name')
            ->paginate($request->integer('per_page', 15));

        return response()->json($users);
    }

    public function store(UserRequest $request)
    {
        $data = $request->validated();
        unset($data['confirm_password']);
        // hashed cast will handle password
        $user = User::create($data);
        return response()->json($user->load('role'), 201);
    }

    public function show(User $user)
    {
        return response()->json($user->load('role'));
    }

    public function update(UserRequest $request, User $user)
    {
        $data = $request->validated();
        unset($data['confirm_password']);
        // hashed cast will handle password
        $user->update($data);
        return response()->json($user->load('role'));
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->noContent();
    }
}
