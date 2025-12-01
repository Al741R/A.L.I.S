<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\RoleRequest;
use App\Models\Role;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        $roles = Role::query()->orderBy('id','asc')->paginate($request->integer('per_page', 15));
        return response()->json($roles);
    }

    public function store(RoleRequest $request)
    {
        $role = Role::create($request->validated());
        return response()->json($role, 201);
    }

    public function show(Role $role)
    {
        return response()->json($role);
    }

    public function update(RoleRequest $request, Role $role)
    {
        $role->update($request->validated());
        return response()->json($role);
    }

    public function destroy(Role $role)
    {
        $role->delete();
        return response()->noContent();
    }
}
