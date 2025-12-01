<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\BorrowRequest;
use App\Models\BorrowTransaction;
use App\Models\Book;
use App\Services\ActivityLogService;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BorrowRequestController extends Controller
{
    public function index(Request $request)
    {
        $actor = $request->user();
        if (!$actor || !($actor->isLibrarian() || $actor->isAdmin())) {
            abort(403, 'Only librarian or admin can view all borrow requests.');
        }
        $status = $request->get('status');
        $q = BorrowRequest::query()
            ->with(['borrower.role','librarian.role','book'])
            ->when($status, fn($s) => $s->where('status', $status))
            ->orderByDesc('created_at');
        return response()->json($q->paginate($request->integer('per_page', 15)));
    }

    public function myIndex(Request $request)
    {
        $actor = $request->user();
        if (!$actor || !$actor->isBorrower()) {
            abort(403, 'Only borrowers can view their borrow requests.');
        }
        $q = BorrowRequest::query()
            ->with(['book'])
            ->where('user_id', $actor->id)
            ->orderByDesc('created_at');
        return response()->json($q->paginate($request->integer('per_page', 15)));
    }

    public function store(Request $request)
    {
        $actor = $request->user();
        if (!$actor || !$actor->isBorrower()) {
            abort(403, 'Only borrowers can create borrow requests.');
        }
        $validated = $request->validate([
            'book_id' => ['required','exists:books,id']
        ]);
        // Basic rule: prevent multiple pending requests for same book by same user.
        $exists = BorrowRequest::query()->where('user_id', $actor->id)->where('book_id', $validated['book_id'])->where('status', BorrowRequest::STATUS_PENDING)->exists();
        if ($exists) {
            abort(422, 'Pending request already exists for this book.');
        }
        $book = Book::findOrFail($validated['book_id']);
        $req = BorrowRequest::create([
            'user_id' => $actor->id,
            'book_id' => $book->id,
            'status' => BorrowRequest::STATUS_PENDING,
        ])->load(['borrower','book']);
        ActivityLogService::log($actor->id, 'BORROW_REQUESTED', 'Borrower requested book ID '.$book->id);
        return response()->json($req, 201);
    }

    public function approve(Request $request, BorrowRequest $borrow_request)
    {
        $actor = $request->user();
        if (!$actor || !($actor->isLibrarian() || $actor->isAdmin())) {
            abort(403, 'Only librarian or admin can approve borrow requests.');
        }
        if ($borrow_request->status !== BorrowRequest::STATUS_PENDING) {
            abort(422, 'Request not pending.');
        }
        $result = DB::transaction(function () use ($borrow_request, $actor) {
            // Decrement inventory and create transaction
            $book = InventoryService::decrementAvailable($borrow_request->book_id);
            $tx = BorrowTransaction::create([
                'user_id' => $borrow_request->user_id,
                'book_id' => $borrow_request->book_id,
                'librarian_id' => $actor->id,
                'date_borrowed' => now(),
                'status' => BorrowTransaction::STATUS_BORROWED,
                'due_date' => now()->addDays(7), // adjust policy or expose via request
            ]);
            $borrow_request->status = BorrowRequest::STATUS_APPROVED;
            $borrow_request->approved_at = now();
            $borrow_request->librarian_id = $actor->id;
            $borrow_request->save();
            ActivityLogService::log($actor->id, 'BORROW_REQUEST_APPROVED', 'Approved borrow request ID '.$borrow_request->id.' -> transaction ID '.$tx->id);
            return [
                'request' => $borrow_request->load(['borrower','librarian','book']),
                'transaction' => $tx->load(['borrower','librarian','book']),
            ];
        });
        return response()->json($result);
    }

    public function deny(Request $request, BorrowRequest $borrow_request)
    {
        $actor = $request->user();
        if (!$actor || !($actor->isLibrarian() || $actor->isAdmin())) {
            abort(403, 'Only librarian or admin can deny borrow requests.');
        }
        if ($borrow_request->status !== BorrowRequest::STATUS_PENDING) {
            abort(422, 'Request not pending.');
        }
        $borrow_request->status = BorrowRequest::STATUS_DENIED;
        $borrow_request->denied_at = now();
        $borrow_request->librarian_id = $actor->id;
        $borrow_request->save();
        ActivityLogService::log($actor->id, 'BORROW_REQUEST_DENIED', 'Denied borrow request ID '.$borrow_request->id);
        return response()->json($borrow_request->load(['borrower','librarian','book']));
    }

    public function destroy(Request $request, BorrowRequest $borrow_request)
    {
        $actor = $request->user();
        if (!$actor || ($actor->id !== $borrow_request->user_id && !$actor->isAdmin() && !$actor->isLibrarian())) {
            abort(403, 'Unauthorized.');
        }
        if ($borrow_request->status !== BorrowRequest::STATUS_PENDING) {
            abort(422, 'Only pending requests can be cancelled.');
        }
        $borrow_request->status = BorrowRequest::STATUS_CANCELLED;
        $borrow_request->save();
        ActivityLogService::log($actor->id, 'BORROW_REQUEST_CANCELLED', 'Cancelled borrow request ID '.$borrow_request->id);
        return response()->json($borrow_request->load(['borrower','book']));
    }
}
