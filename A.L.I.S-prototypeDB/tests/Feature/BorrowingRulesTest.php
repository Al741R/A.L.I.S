<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Models\Book;
use App\Models\BorrowTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BorrowingRulesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
    }

    public function test_cannot_issue_new_borrow_when_borrower_has_overdue_unreturned(): void
    {
        $librarianRoleId = Role::where('role_name','Librarian')->value('id');
        $borrowerRoleId = Role::where('role_name','Borrower')->value('id');

        // Ensure a category exists (FK needed by books)
        $categoryId = \App\Models\Category::query()->value('id') ?? \App\Models\Category::create(['category_name' => 'General'])->id;

        $librarian = User::create([
            'role_id' => $librarianRoleId,
            'first_name' => 'Lib',
            'last_name' => 'User',
            'email' => 'lib@example.com',
            'password' => bcrypt('password'),
            'employee_number' => 'EMP-9001',
            'status' => User::STATUS_ACTIVE,
            'date_registered' => now(),
        ]);

        $borrower = User::create([
            'role_id' => $borrowerRoleId,
            'first_name' => 'Stu',
            'last_name' => 'Dent',
            'email' => 'student@example.com',
            'password' => bcrypt('password'),
            'student_number' => 'SID-9001',
            'status' => User::STATUS_ACTIVE,
            'date_registered' => now(),
        ]);

        $book1 = Book::create([
            'isbn' => '9780000002000',
            'title' => 'Overdue Book',
            'author' => 'Author',
            'year_published' => 2024,
            'category_id' => $categoryId,
            'total_copies' => 1,
            'available_copies' => 1,
            'date_added' => now(),
        ]);

        // Create existing overdue borrow (due date in past, not returned)
        BorrowTransaction::create([
            'user_id' => $borrower->id,
            'book_id' => $book1->id,
            'librarian_id' => $librarian->id,
            'date_borrowed' => now()->subDays(10),
            'due_date' => now()->subDays(3),
            'status' => BorrowTransaction::STATUS_BORROWED,
        ]);

        $book2 = Book::create([
            'isbn' => '9780000002001',
            'title' => 'Attempt Book',
            'author' => 'Author',
            'year_published' => 2024,
            'category_id' => $categoryId,
            'total_copies' => 1,
            'available_copies' => 1,
            'date_added' => now(),
        ]);

        Sanctum::actingAs($librarian);

        $payload = [
            'user_id' => $borrower->id,
            'book_id' => $book2->id,
            'due_date' => now()->addDays(7)->toISOString(),
        ];

        $res = $this->postJson('/api/v1/borrow-transactions', $payload);
        $res->assertStatus(422);
        $res->assertSeeText('overdue');
    }
}
