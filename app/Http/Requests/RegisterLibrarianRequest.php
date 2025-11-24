<?php

namespace App\Http\Requests;

use App\Models\Role;
use App\Models\User;

class RegisterLibrarianRequest extends UserRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();
        $librarianRoleId = Role::query()->where('role_name', User::ROLE_LIBRARIAN)->value('id');
        $this->merge([
            // Force role to Librarian on this admin-protected route
            'role_id' => $librarianRoleId,
            'status' => $this->input('status', User::STATUS_ACTIVE),
            'date_registered' => $this->input('date_registered', now()),
        ]);
    }
}
