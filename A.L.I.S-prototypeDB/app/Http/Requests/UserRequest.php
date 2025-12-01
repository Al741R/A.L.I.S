<?php

namespace App\Http\Requests;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userParam = $this->route('user');
        $userId = is_object($userParam) ? $userParam->id : $userParam;

        return [
            'role_id' => ['required','exists:roles,id'],
            'student_number' => ['nullable','string','max:100', Rule::unique('users','student_number')->ignore($userId)],
            'faculty_number' => ['nullable','string','max:100', Rule::unique('users','faculty_number')->ignore($userId)],
            'employee_number' => ['nullable','string','max:100', Rule::unique('users','employee_number')->ignore($userId)],
            'first_name' => ['required','string','max:150'],
            'last_name' => ['required','string','max:150'],
            'email' => ['required','email','max:255', Rule::unique('users','email')->ignore($userId)],
            // require confirmation on create; allow update without changing password
            'password' => [$this->isMethod('post') ? 'required' : 'sometimes','string','min:8','same:confirm_password'],
            'confirm_password' => [$this->isMethod('post') ? 'required' : 'sometimes','string','min:8'],
            'status' => ['required','in:Active,Inactive'],
            'date_registered' => ['required','date'],
        ];
    }

    protected function prepareForValidation(): void
    {
        foreach (['student_number','faculty_number','employee_number'] as $k) {
            if ($this->has($k) && $this->input($k) === '') {
                $this->merge([$k => null]);
            }
        }
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $roleId = $this->input('role_id');
            if (!$roleId) return;
            $roleName = Role::query()->whereKey($roleId)->value('role_name');
            $actor = $this->user();

            $student = $this->input('student_number');
            $faculty = $this->input('faculty_number');
            $employee = $this->input('employee_number');

            $present = array_values(array_filter([
                'student' => $student !== null && $student !== '',
                'faculty' => $faculty !== null && $faculty !== '',
                'employee' => $employee !== null && $employee !== '',
            ]));

            // Only Admins can assign Librarian/Admin roles when creating/updating via generic users endpoints
            if (in_array($roleName, ['Librarian','Admin'], true) && (!$actor || !$actor->isAdmin())) {
                $validator->errors()->add('role_id', 'Only Admin can assign Librarian or Admin roles.');
            }

            if ($roleName === 'Borrower') {
                // Borrower must supply exactly one of student_number (SID) or faculty_number (FID)
                if (empty($student) && empty($faculty)) {
                    $validator->errors()->add('student_number', 'Provide either SID (student_number) or FID (faculty_number).');
                    $validator->errors()->add('faculty_number', 'Provide either SID (student_number) or FID (faculty_number).');
                }
                if (!empty($student) && !empty($faculty)) {
                    $validator->errors()->add('student_number', 'Provide only one identifier: SID or FID, not both.');
                    $validator->errors()->add('faculty_number', 'Provide only one identifier: SID or FID, not both.');
                }
                if (!empty($employee)) {
                    $validator->errors()->add('employee_number', 'Borrowers cannot have employee_number.');
                }
            } else {
                // Non-borrower roles (Librarian/Admin) must have employee_number exclusively
                if ($roleName === 'Librarian' || $roleName === 'Admin') {
                    if (empty($employee)) {
                        $validator->errors()->add('employee_number', 'Librarian/Admin must have employee_number.');
                    }
                    if (!empty($student) || !empty($faculty)) {
                        $validator->errors()->add('student_number', 'Librarian/Admin cannot have SID/FID.');
                        $validator->errors()->add('faculty_number', 'Librarian/Admin cannot have SID/FID.');
                    }
                } else {
                    // Generic rule: only one identifier allowed if multiple types somehow provided
                    if (count(array_filter([$student,$faculty,$employee], fn($v) => !empty($v))) > 1) {
                        $validator->errors()->add('identifier', 'Provide only one of SID (student_number), FID (faculty_number), or employee_number.');
                    }
                }
            }
        });
    }
}
