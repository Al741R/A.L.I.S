<?php

namespace App\Http\Requests;

use App\Models\Role;
use App\Models\User;

class RegisterBorrowerRequest extends UserRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();
        $borrowerRoleId = Role::query()->where('role_name', User::ROLE_BORROWER)->value('id');
        $this->merge([
            // Force role to Borrower for public signup
            'role_id' => $borrowerRoleId,
            'status' => $this->input('status', User::STATUS_ACTIVE),
            'date_registered' => $this->input('date_registered', now()),
        ]);
    }
}
