<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Models\Book;
use App\Models\BorrowTransaction;
use App\Models\ActivityLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OverdueCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
    }

    public function test_command_marks_overdue_and_logs_activity(): void
    {
        $librarianRoleId = Role::where('role_name','Librarian')->value('id');
        $borrowerRoleId = Role::where('role_name','Borrower')->value('id');
        $categoryId = \App\Models\Category::query()->value('id') ?? \App\Models\Category::create(['category_name' => 'General'])->id;

        $librarian = User::create([
            'role_id' => $librarianRoleId,
            'first_name' => 'Lib',
            'last_name' => 'User',
            'email' => 'libcmd@example.com',
            'password' => 'password',
            'employee_number' => 'EMP-7777',
            'status' => User::STATUS_ACTIVE,
            'date_registered' => now(),
        ]);

        $borrower = User::create([
            'role_id' => $borrowerRoleId,
            'first_name' => 'Stu',
            'last_name' => 'Dent',
            'email' => 'studentcmd@example.com',
            'password' => 'password',
            'student_number' => 'SID-7777',
            'status' => User::STATUS_ACTIVE,
            'date_registered' => now(),
        ]);

        $book = Book::create([
            'isbn' => '9780000003000',
            'title' => 'Scheduled Book',
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
            'date_borrowed' => now()->subDays(10),
            'due_date' => now()->subDays(2),
            'status' => BorrowTransaction::STATUS_BORROWED,
        ]);

        $this->artisan('borrow:mark-overdue')->assertSuccessful()->expectsOutput('Overdue transactions marked: 1');

        $this->assertEquals('Overdue', $tx->fresh()->status);
        $this->assertTrue(ActivityLog::query()->where('action_type','BORROW_MARKED_OVERDUE')->where('description','like','%'.$tx->id.'%')->exists());
    }
}
