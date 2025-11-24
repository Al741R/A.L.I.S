<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportsDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
    }

    public function test_dashboard_returns_all_ranges(): void
    {
        $adminRoleId = Role::where('role_name','Admin')->value('id');
        $admin = User::create([
            'role_id' => $adminRoleId,
            'first_name' => 'Sys',
            'last_name' => 'Admin',
            'email' => 'dashadmin@example.com',
            'password' => 'password',
            'employee_number' => 'EMP-4000',
            'status' => User::STATUS_ACTIVE,
            'date_registered' => now(),
        ]);

        Sanctum::actingAs($admin);

        $res = $this->getJson('/api/v1/reports/dashboard?limit=3');
        $res->assertOk();
        $data = $res->json();
        foreach (['week','month','year'] as $range) {
            $this->assertArrayHasKey($range, $data);
            foreach (['borrowing','returns','overdues','fines','mostBorrowed','userActivity'] as $k) {
                $this->assertArrayHasKey($k, $data[$range]);
            }
        }
    }

    public function test_dashboard_pairs_layout_adds_pairs_arrays(): void
    {
        $adminRoleId = Role::where('role_name','Admin')->value('id');
        $admin = User::create([
            'role_id' => $adminRoleId,
            'first_name' => 'Sys',
            'last_name' => 'Admin',
            'email' => 'dashadmin2@example.com',
            'password' => 'password',
            'employee_number' => 'EMP-5000',
            'status' => User::STATUS_ACTIVE,
            'date_registered' => now(),
        ]);

        Sanctum::actingAs($admin);

        $res = $this->getJson('/api/v1/reports/dashboard?layout=pairs');
        $res->assertOk();
        $data = $res->json();
        foreach (['week','month','year'] as $range) {
            $this->assertArrayHasKey($range, $data);
            $rangeBlock = $data[$range];
            // Verify pairs exist for datasets with labels
            $this->assertArrayHasKey('pairs', $rangeBlock['borrowing']);
            $this->assertArrayHasKey('pairs', $rangeBlock['returns']);
            $this->assertArrayHasKey('pairs', $rangeBlock['overdues']);
            $this->assertArrayHasKey('pairs', $rangeBlock['fines']);
            $this->assertArrayHasKey('pairs', $rangeBlock['userActivity']);
            // mostBorrowed remains a simple list, no pairs expected
            $this->assertArrayNotHasKey('pairs', $rangeBlock['mostBorrowed']);
        }
    }
}
