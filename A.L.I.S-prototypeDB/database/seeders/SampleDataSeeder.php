<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Book;
use App\Models\BorrowTransaction;
use App\Models\OverdueFine;
use App\Models\User;
use App\Models\Category;
use App\Models\ActivityLog;
use Carbon\Carbon;

class SampleDataSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure at least one category
        $cat = Category::first() ?? Category::create(['category_name' => 'General']);

        // Users
        $librarian = User::where('email','librarian@example.com')->first();
        $borrower = User::where('email','borrower@example.com')->first();
        if (!$librarian || !$borrower) {
            return; // require TestUsersSeeder first
        }

        // Books
        $books = [];
        $bookSpecs = [
            ['isbn' => '9780000001001', 'title' => 'Intro to ALIS'],
            ['isbn' => '9780000001002', 'title' => 'Laravel for Libraries'],
            ['isbn' => '9780000001003', 'title' => 'Modern PHP Patterns'],
            ['isbn' => '9780000001004', 'title' => 'Database Design 101'],
            ['isbn' => '9780000001005', 'title' => 'Effective Testing'],
        ];
        foreach ($bookSpecs as $spec) {
            $book = Book::firstOrCreate(
                ['isbn' => $spec['isbn']],
                [
                    'title' => $spec['title'],
                    'author' => 'Various',
                    'year_published' => 2024,
                    'category_id' => $cat->id,
                    'total_copies' => 3,
                    'available_copies' => 3,
                    'date_added' => now()->subDays(20),
                ]
            );
            $books[] = $book;
            ActivityLog::firstOrCreate([
                'user_id' => $librarian->id,
                'action_type' => 'BOOK_CREATED',
                'description' => 'Seed created book ID '.$book->id,
                'date_time' => now()->subDays(14),
            ]);
        }

        // Transactions over last 14 days
        $daily = range(14, 1);
        $fineRate = 10.0;
        foreach ($daily as $d) {
            $dateBorrowed = Carbon::today()->subDays($d)->setTime(10, 0);
            $dueDate = (clone $dateBorrowed)->addDays(7);
            $book = $books[array_rand($books)];

            $tx = BorrowTransaction::create([
                'user_id' => $borrower->id,
                'book_id' => $book->id,
                'librarian_id' => $librarian->id,
                'date_borrowed' => $dateBorrowed,
                'due_date' => $dueDate,
                'status' => BorrowTransaction::STATUS_BORROWED,
            ]);

            ActivityLog::create([
                'user_id' => $librarian->id,
                'action_type' => 'BORROW_ISSUED',
                'description' => 'Seed issued book ID '.$book->id.' to user ID '.$borrower->id,
                'date_time' => $dateBorrowed,
            ]);

            // 50% returned on time, 25% returned late, 25% still overdue
            $rand = rand(1, 4);
            if ($rand <= 2) {
                // returned on/before due
                $returnDate = (clone $dateBorrowed)->addDays(rand(1, 6));
                $tx->update([
                    'date_returned' => $returnDate,
                    'status' => BorrowTransaction::STATUS_RETURNED,
                ]);
                ActivityLog::create([
                    'user_id' => $librarian->id,
                    'action_type' => 'BOOK_RETURNED',
                    'description' => 'Seed returned book ID '.$book->id,
                    'date_time' => $returnDate,
                ]);
            } elseif ($rand === 3) {
                // returned late
                $returnDate = (clone $dueDate)->addDays(rand(1, 3));
                $tx->update([
                    'date_returned' => $returnDate,
                    'status' => BorrowTransaction::STATUS_RETURNED,
                ]);
                $daysLate = max(0, (int) ceil(($returnDate->timestamp - $dueDate->timestamp) / 86400));
                OverdueFine::create([
                    'transaction_id' => $tx->id,
                    'amount' => $daysLate * $fineRate,
                    'settled' => (bool) rand(0,1),
                    'date_settled' => rand(0,1) ? $returnDate->copy()->addDay() : null,
                ]);
                ActivityLog::create([
                    'user_id' => $librarian->id,
                    'action_type' => 'BOOK_RETURNED',
                    'description' => 'Seed returned book ID '.$book->id.' late',
                    'date_time' => $returnDate,
                ]);
            } else {
                // overdue not returned yet
                if ($dueDate->lt(Carbon::now())) {
                    OverdueFine::create([
                        'transaction_id' => $tx->id,
                        'amount' => 0, // amount accrual not applied until return; kept for testing
                        'settled' => false,
                        'date_settled' => null,
                    ]);
                }
            }
        }

        // Registration logs (for activity report)
        ActivityLog::firstOrCreate([
            'user_id' => $librarian->id,
            'action_type' => 'REGISTER_BORROWER',
            'description' => 'Seed registered borrower user ID '.$borrower->id,
            'date_time' => now()->subDays(10),
        ]);
        ActivityLog::firstOrCreate([
            'user_id' => $librarian->id,
            'action_type' => 'REGISTER_LIBRARIAN',
            'description' => 'Seed registered librarian user ID '.$librarian->id,
            'date_time' => now()->subDays(12),
        ]);
    }
}
