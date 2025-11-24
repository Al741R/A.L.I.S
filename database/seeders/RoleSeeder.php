<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        Role::query()->upsert([
            ['id' => 1, 'role_name' => 'Admin', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'role_name' => 'Librarian', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'role_name' => 'Borrower', 'created_at' => $now, 'updated_at' => $now],
        ], ['id'], ['role_name','updated_at']);
    }
}
