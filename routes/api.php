<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\RoleController;
use App\Http\Controllers\API\CategoryController;
use App\Http\Controllers\API\BookController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\BorrowTransactionController;
use App\Http\Controllers\API\OverdueFineController;
use App\Http\Controllers\API\ActivityLogController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ReportController;
use App\Http\Controllers\API\BorrowRequestController;

// OPTIONS fallback (inside api routes namespace -> results in /api/v1/*). Keep simple 204.
Route::prefix('v1')->group(function () {
    Route::options('{any}', function () {
        return response()->noContent(204);
    })->where('any', '.*');
    // Auth endpoints
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::post('auth/register', [AuthController::class, 'publicRegisterBorrower']);

    // Public reads (optional): list books/categories
    Route::get('books', [BookController::class, 'index']);
    Route::get('books/{book}', [BookController::class, 'show']);
    Route::get('categories', [CategoryController::class, 'index']);
    Route::get('categories/{category}', [CategoryController::class, 'show']);

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        // Activity logs (read-only for authenticated)
        Route::apiResource('activity-logs', ActivityLogController::class)->only(['index','show']);

        // Borrower-specific endpoints (scoped)
        Route::middleware('role:Borrower')->group(function () {
            Route::get('my/borrow-transactions', [BorrowTransactionController::class, 'myIndex']);
            Route::post('borrow-transactions/{transaction}/request-return', [BorrowTransactionController::class, 'requestReturn']);
            // Borrow requests lifecycle (borrower side)
            Route::get('my/borrow-requests', [BorrowRequestController::class, 'myIndex']);
            Route::post('borrow-requests', [BorrowRequestController::class, 'store']);
        });

        // Librarian/Admin manage inventory and users & finalize returns
        Route::middleware('role:Librarian,Admin')->group(function () {
            Route::apiResource('books', BookController::class)->only(['store','update','destroy']);
            Route::apiResource('categories', CategoryController::class)->only(['store','update','destroy']);
            Route::apiResource('users', UserController::class);

            // Borrowing flow
            Route::apiResource('borrow-transactions', BorrowTransactionController::class)->only(['index','show','store','update','destroy']);
            Route::post('borrow-transactions/{transaction}/return', [BorrowTransactionController::class, 'returnBook']);
            // Borrow requests (admin/librarian management)
            Route::get('borrow-requests', [BorrowRequestController::class, 'index']);
            Route::post('borrow-requests/{borrow_request}/approve', [BorrowRequestController::class, 'approve']);
            Route::post('borrow-requests/{borrow_request}/deny', [BorrowRequestController::class, 'deny']);
            Route::delete('borrow-requests/{borrow_request}', [BorrowRequestController::class, 'destroy']);

            // Fines management
            Route::apiResource('overdue-fines', OverdueFineController::class)->only(['index','show','update']);
            Route::post('overdue-fines/{fine}/settle', [OverdueFineController::class, 'settle']);

            // Registration shortcuts
            Route::post('auth/register/borrower', [AuthController::class, 'registerBorrower']);
            Route::middleware('role:Admin')->post('auth/register/librarian', [AuthController::class, 'registerLibrarian']);

            // Reports (weekly)
            Route::prefix('reports')->group(function () {
                Route::get('weekly/borrowing', [ReportController::class, 'weeklyBorrowing']);
                Route::get('weekly/returns', [ReportController::class, 'weeklyReturns']);
                Route::get('weekly/overdues', [ReportController::class, 'weeklyOverdues']);
                Route::get('weekly/fines', [ReportController::class, 'weeklyFines']);
                Route::get('weekly/most-borrowed', [ReportController::class, 'mostBorrowed']);
                Route::get('weekly/user-activity', [ReportController::class, 'weeklyUserActivity']);
                Route::get('weekly/summary', [ReportController::class, 'weeklySummary']);
                Route::get('dashboard', [ReportController::class, 'dashboard']);
            });
        });
    });
});
