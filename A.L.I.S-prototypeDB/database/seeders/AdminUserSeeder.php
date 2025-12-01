<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\User;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $adminRoleId = Role::query()->where('role_name', 'Admin')->value('id');
        if (!$adminRoleId) {
            return; // RoleSeeder should have created it
        }

        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'role_id' => $adminRoleId,
                'first_name' => 'System',
                'last_name' => 'Admin',
                'employee_number' => 'EMP-0001',
                'status' => User::STATUS_ACTIVE,
                'date_registered' => now(),
                'password' => bcrypt('password'),
            ]
        );
    }
}
