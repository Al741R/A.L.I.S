<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Models\Book;
use App\Models\BorrowTransaction;
use App\Models\ActivityLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FineCreationLogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
    }

    public function test_fine_creation_logs_activity(): void
    {
        $librarianRoleId = Role::where('role_name','Librarian')->value('id');
        $borrowerRoleId = Role::where('role_name','Borrower')->value('id');
        $categoryId = \App\Models\Category::query()->value('id') ?? \App\Models\Category::create(['category_name' => 'General'])->id;

        $librarian = User::create([
            'role_id' => $librarianRoleId,
            'first_name' => 'Lib',
            'last_name' => 'Fine',
            'email' => 'libfine@example.com',
            'password' => 'password',
            'employee_number' => 'EMP-5555',
            'status' => User::STATUS_ACTIVE,
            'date_registered' => now(),
        ]);

        $borrower = User::create([
            'role_id' => $borrowerRoleId,
            'first_name' => 'Stu',
            'last_name' => 'Fine',
            'email' => 'stufine@example.com',
            'password' => 'password',
            'student_number' => 'SID-5555',
            'status' => User::STATUS_ACTIVE,
            'date_registered' => now(),
        ]);

        $book = Book::create([
            'isbn' => '9780000004000',
            'title' => 'Late Book',
            'author' => 'Author',
            'year_published' => 2024,
            'category_id' => $categoryId,
            'total_copies' => 1,
            'available_copies' => 1,
            'date_added' => now(),
        ]);

        $tx = BorrowTransaction::create([
            'user_id' => $borrower->id,
            'book_id' => $book->id,
            'librarian_id' => $librarian->id,
            'date_borrowed' => now()->subDays(5),
            'due_date' => now()->subDays(3),
            'status' => BorrowTransaction::STATUS_BORROWED,
        ]);

        Sanctum::actingAs($librarian);

        $payload = [
            'date_returned' => now()->toISOString(),
        ];
        $res = $this->postJson('/api/v1/borrow-transactions/'.$tx->id.'/return', $payload);
        $res->assertOk();

        $this->assertTrue(ActivityLog::query()->where('action_type','FINE_CREATED')->where('description','like','%'.$tx->id.'%')->exists());
        $this->assertNotNull($tx->fresh()->overdueFine);
    }
}
