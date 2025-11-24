<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();
        if (!$user || !$user->relationLoaded('role')) {
            $user?->load('role');
        }
        if (!$user || !$user->role || !in_array($user->role->role_name, $roles, true)) {
            abort(403, 'Unauthorized');
        }
        return $next($request);
    }
}
