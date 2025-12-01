<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\BorrowReturnRequest;
use App\Http\Requests\BorrowTransactionStoreRequest;
use App\Services\ActivityLogService;
use App\Services\InventoryService;
use App\Models\Book;
use App\Models\BorrowTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BorrowTransactionController extends Controller
{
    private const DAILY_FINE = 10.00; // adjust as needed or move to config

    public function index(Request $request)
    {
        $status = $request->get('status');
        $overdue = $request->boolean('overdue');
        $tx = BorrowTransaction::query()
            ->with(['borrower','librarian','book.category'])
            // If overdue flag is set, ignore explicit status and compute overdue set.
            ->when(!$overdue && $status, fn($s) => $s->where('status', $status))
            ->when($overdue, function ($q) {
                $q->where(function ($sub) {
                    $sub->where('status', BorrowTransaction::STATUS_OVERDUE)
                        ->orWhere(function ($inner) {
                            $inner->where('status', BorrowTransaction::STATUS_BORROWED)
                                  ->whereNull('date_returned')
                                  ->where('due_date', '<', now());
                        });
                });
            })
            ->orderByDesc('date_borrowed')
            ->paginate($request->integer('per_page', 15));
        return response()->json($tx);
    }

    /**
     * Borrower-scoped list of their own transactions.
     */
    public function myIndex(Request $request)
    {
        $user = $request->user();
        $status = $request->get('status');
        $overdue = $request->boolean('overdue');
        $tx = BorrowTransaction::query()
            ->with(['borrower','librarian','book.category'])
            ->where('user_id', $user->id)
            ->when(!$overdue && $status, fn($s) => $s->where('status', $status))
            ->when($overdue, function ($q) {
                $q->where(function ($sub) {
                    $sub->where('status', BorrowTransaction::STATUS_OVERDUE)
                        ->orWhere(function ($inner) {
                            $inner->where('status', BorrowTransaction::STATUS_BORROWED)
                                  ->whereNull('date_returned')
                                  ->where('due_date', '<', now());
                        });
                });
            })
            ->orderByDesc('date_borrowed')
            ->paginate($request->integer('per_page', 15));
        return response()->json($tx);
    }

    public function store(BorrowTransactionStoreRequest $request)
    {
        $validated = $request->validated();
        // Derive librarian from auth user
        $actor = $request->user();
        if (!($actor && ($actor->isLibrarian() || $actor->isAdmin()))) {
            abort(403, 'Only librarian or admin can process borrowing.');
        }
        $validated['librarian_id'] = $actor->id;

        // Validate roles for borrower
        $borrower = \App\Models\User::with('role')->findOrFail($validated['user_id']);
        if (!$borrower->isBorrower()) {
            abort(422, 'Borrower must have Borrower role.');
        }
        // Prevent borrowing if borrower has outstanding overdue transaction
        $hasOverdue = BorrowTransaction::query()
            ->where('user_id', $validated['user_id'])
            ->where(function ($q) {
                $q->where(function ($sub) {
                    $sub->whereNull('date_returned')
                        ->where('status', BorrowTransaction::STATUS_BORROWED)
                        ->where('due_date', '<', now());
                })->orWhere('status', BorrowTransaction::STATUS_OVERDUE);
            })
            ->exists();
        if ($hasOverdue) {
            abort(422, 'Borrower has unresolved overdue transaction(s).');
        }
        $validated['date_borrowed'] = $validated['date_borrowed'] ?? now();
        $validated['status'] = BorrowTransaction::STATUS_BORROWED;

        $result = DB::transaction(function () use ($validated) {
            $book = InventoryService::decrementAvailable($validated['book_id']);

            $tx = BorrowTransaction::create($validated);

            ActivityLogService::log($validated['librarian_id'], 'BORROW_ISSUED', 'Issued book ID '.$book->id.' to user ID '.$validated['user_id']);

            return $tx->load(['borrower','librarian','book']);
        });

        return response()->json($result, 201);
    }

    public function show(BorrowTransaction $borrow_transaction)
    {
        return response()->json($borrow_transaction->load(['borrower','librarian','book','overdueFine']));
    }

    public function update(Request $request, BorrowTransaction $borrow_transaction)
    {
        $borrow_transaction->update($request->validate([
            'status' => ['sometimes','in:'.implode(',', [
                BorrowTransaction::STATUS_BORROWED,
                BorrowTransaction::STATUS_RETURNED,
                BorrowTransaction::STATUS_OVERDUE,
                BorrowTransaction::STATUS_LOST,
                BorrowTransaction::STATUS_RETURN_REQUESTED,
            ])],
        ]));

        return response()->json($borrow_transaction->load(['borrower','librarian','book']));
    }

    public function destroy(BorrowTransaction $borrow_transaction)
    {
        $borrow_transaction->delete();
        return response()->noContent();
    }

    public function returnBook(BorrowReturnRequest $request, BorrowTransaction $transaction)
    {
        $dateReturned = $request->validated()['date_returned'];

        $result = DB::transaction(function () use ($transaction, $dateReturned) {
            if ($transaction->date_returned) {
                abort(422, 'Transaction already returned');
            }

            $transaction->date_returned = $dateReturned;
            $transaction->status = BorrowTransaction::STATUS_RETURNED;
            $transaction->save();

            // increment available copies
            InventoryService::incrementAvailable($transaction->book_id);

            // handle overdue
            if ($transaction->due_date && $transaction->date_returned > $transaction->due_date) {
                $days = Carbon::parse($transaction->due_date)->diffInDays(Carbon::parse($transaction->date_returned), false);
                $days = max(0, $days);
                $amount = $days * self::DAILY_FINE;
                $fine = $transaction->overdueFine()->create([
                    'amount' => $amount,
                    'settled' => false,
                    'date_settled' => null,
                ]);
                ActivityLogService::log($transaction->librarian_id, 'FINE_CREATED', 'Created fine ID '.$fine->id.' for transaction ID '.$transaction->id.' amount '.$amount);
            }

            ActivityLogService::log($transaction->librarian_id, 'BOOK_RETURNED', 'Returned book ID '.$transaction->book_id.' by user ID '.$transaction->user_id);

            return $transaction->load(['borrower','librarian','book','overdueFine']);
        });

        return response()->json($result);
    }

    /**
     * Borrower initiates a return request; librarian will finalize via returnBook.
     */
    public function requestReturn(Request $request, BorrowTransaction $transaction)
    {
        $actor = $request->user();
        if (!$actor || !$actor->isBorrower()) {
            abort(403, 'Only borrowers can request return.');
        }
        if ($transaction->user_id !== $actor->id) {
            abort(403, 'Cannot request return for another user\'s transaction.');
        }
        if ($transaction->date_returned) {
            abort(422, 'Transaction already returned.');
        }
        if (!in_array($transaction->status, [BorrowTransaction::STATUS_BORROWED, BorrowTransaction::STATUS_OVERDUE])) {
            abort(422, 'Return can only be requested for active or overdue transactions.');
        }

        $transaction->status = BorrowTransaction::STATUS_RETURN_REQUESTED;
        $transaction->save();

        ActivityLogService::log($actor->id, 'RETURN_REQUESTED', 'User requested return for transaction ID '.$transaction->id.' book ID '.$transaction->book_id);

        return response()->json($transaction->load(['borrower','librarian','book']));
    }
}
