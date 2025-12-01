<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\User;

class TestUsersSeeder extends Seeder
{
    public function run(): void
    {
        $adminRoleId = Role::query()->where('role_name','Admin')->value('id');
        $librarianRoleId = Role::query()->where('role_name','Librarian')->value('id');
        $borrowerRoleId = Role::query()->where('role_name','Borrower')->value('id');

        if ($librarianRoleId) {
            User::updateOrCreate(
                ['email' => 'librarian@example.com'],
                [
                    'role_id' => $librarianRoleId,
                    'first_name' => 'Libby',
                    'last_name' => 'Rarian',
                    'employee_number' => 'EMP-0002',
                    'status' => User::STATUS_ACTIVE,
                    'date_registered' => now(),
                    'password' => bcrypt('password'),
                ]
            );
        }

        if ($borrowerRoleId) {
            User::updateOrCreate(
                ['email' => 'borrower@example.com'],
                [
                    'role_id' => $borrowerRoleId,
                    'first_name' => 'Boro',
                    'last_name' => 'Wer',
                    'student_number' => 'STU-0001',
                    'status' => User::STATUS_ACTIVE,
                    'date_registered' => now(),
                    'password' => bcrypt('password'),
                ]
            );
        }
    }
}
