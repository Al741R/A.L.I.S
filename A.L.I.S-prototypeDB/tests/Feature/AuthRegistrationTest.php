<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthRegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Seed roles for tests
        $this->seed(\Database\Seeders\RoleSeeder::class);
    }

    public function test_public_borrower_signup_assigns_borrower_and_requires_confirm_password_and_sid_or_fid(): void
    {
        $email = 'borrower+'.Str::random(6).'@example.com';

        $payload = [
            'first_name' => 'Jane',
            'last_name' => 'Student',
            'email' => $email,
            'password' => 'Password123!',
            'confirm_password' => 'Password123!',
            'student_number' => 'SID-'.Str::upper(Str::random(6)),
        ];

        $res = $this->postJson('/api/v1/auth/register', $payload);
        $res->assertCreated();

        $res->assertJsonStructure(['token','user' => ['id','role' => ['id','role_name']]]);
        $this->assertSame('Borrower', $res->json('user.role.role_name'));
    }

    public function test_librarian_cannot_register_librarian_via_admin_endpoint(): void
    {
        $librarianRoleId = Role::where('role_name','Librarian')->value('id');

        $librarian = User::create([
            'role_id' => $librarianRoleId,
            'first_name' => 'Lib',
            'last_name' => 'One',
            'email' => 'lib'.Str::random(5).'@example.com',
            'password' => bcrypt('password'),
            'employee_number' => 'EMP-'.rand(1000,9999),
            'status' => User::STATUS_ACTIVE,
            'date_registered' => now(),
        ]);

        Sanctum::actingAs($librarian);

        $payload = [
            'first_name' => 'New',
            'last_name' => 'Librarian',
            'email' => 'newlib'.Str::random(5).'@example.com',
            'password' => 'Password123!',
            'confirm_password' => 'Password123!',
            'employee_number' => 'EMP-'.rand(10000,99999),
        ];

        $res = $this->postJson('/api/v1/auth/register/librarian', $payload);
        $res->assertForbidden();
    }

    public function test_admin_can_register_librarian(): void
    {
        $adminRoleId = Role::where('role_name','Admin')->value('id');

        $admin = User::create([
            'role_id' => $adminRoleId,
            'first_name' => 'Sys',
            'last_name' => 'Admin',
            'email' => 'admin'.Str::random(5).'@example.com',
            'password' => bcrypt('password'),
            'employee_number' => 'EMP-'.rand(1000,9999),
            'status' => User::STATUS_ACTIVE,
            'date_registered' => now(),
        ]);

        Sanctum::actingAs($admin);

        $payload = [
            'first_name' => 'Lib',
            'last_name' => 'Two',
            'email' => 'libtwo'.Str::random(5).'@example.com',
            'password' => 'Password123!',
            'confirm_password' => 'Password123!',
            'employee_number' => 'EMP-'.rand(10000,99999),
        ];

        $res = $this->postJson('/api/v1/auth/register/librarian', $payload);
        $res->assertCreated();
    }

    public function test_librarian_cannot_assign_librarian_or_admin_role_via_users_endpoint(): void
    {
        $librarianRoleId = Role::where('role_name','Librarian')->value('id');
        $adminRoleId = Role::where('role_name','Admin')->value('id');

        $librarian = User::create([
            'role_id' => $librarianRoleId,
            'first_name' => 'Lib',
            'last_name' => 'One',
            'email' => 'libctl'.Str::random(5).'@example.com',
            'password' => bcrypt('password'),
            'employee_number' => 'EMP-'.rand(1000,9999),
            'status' => User::STATUS_ACTIVE,
            'date_registered' => now(),
        ]);

        Sanctum::actingAs($librarian);

        // Attempt to create Librarian via generic users endpoint
        $payload = [
            'role_id' => $librarianRoleId,
            'first_name' => 'Another',
            'last_name' => 'Librarian',
            'email' => 'libmake'.Str::random(5).'@example.com',
            'password' => 'Password123!',
            'confirm_password' => 'Password123!',
            'employee_number' => 'EMP-'.rand(10000,99999),
            'status' => User::STATUS_ACTIVE,
            'date_registered' => now()->toISOString(),
        ];

        $res = $this->postJson('/api/v1/users', $payload);
        $res->assertStatus(422);
        $res->assertJsonValidationErrors(['role_id']);

        // Attempt to create Admin via generic users endpoint
        $payload['role_id'] = $adminRoleId;
        $payload['email'] = 'admmake'.Str::random(5).'@example.com';
        $res = $this->postJson('/api/v1/users', $payload);
        $res->assertStatus(422);
        $res->assertJsonValidationErrors(['role_id']);
    }
}
