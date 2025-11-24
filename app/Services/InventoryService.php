<?php

namespace App\Services;

use App\Models\Book;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class InventoryService
{
    public static function decrementAvailable(int $bookId): Book
    {
        $book = Book::lockForUpdate()->find($bookId);
        if (!$book) throw new ModelNotFoundException("Book $bookId not found");
        if ($book->available_copies < 1) {
            abort(422, 'Book is not available');
        }
        $book->decrement('available_copies');
        return $book;
    }

    public static function incrementAvailable(int $bookId): Book
    {
        $book = Book::lockForUpdate()->find($bookId);
        if (!$book) throw new ModelNotFoundException("Book $bookId not found");
        $new = $book->available_copies + 1;
        if ($new > $book->total_copies) {
            // Clamp and warn but do not exceed total
            $new = $book->total_copies;
        }
        $book->available_copies = $new;
        $book->save();
        return $book;
    }
}
