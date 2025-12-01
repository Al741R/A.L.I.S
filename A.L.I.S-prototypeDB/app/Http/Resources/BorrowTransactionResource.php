<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BorrowTransactionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'borrower' => $this->whenLoaded('borrower', function () {
                return [
                    'id' => $this->borrower->id,
                    'first_name' => $this->borrower->first_name,
                    'last_name' => $this->borrower->last_name,
                    'full_name' => $this->borrower->first_name . ' ' . $this->borrower->last_name,
                    'email' => $this->borrower->email,
                    'student_number' => $this->borrower->student_number,
                ];
            }),
            'book_id' => $this->book_id,
            'book' => $this->whenLoaded('book', function () {
                return [
                    'id' => $this->book->id,
                    'isbn' => $this->book->isbn,
                    'title' => $this->book->title,
                    'author' => $this->book->author,
                    'cover_image' => $this->book->cover_image,
                    'category' => $this->book->category ? [
                        'id' => $this->book->category->id,
                        'category_name' => $this->book->category->category_name,
                    ] : null,
                ];
            }),
            'librarian_id' => $this->librarian_id,
            'librarian' => $this->whenLoaded('librarian', function () {
                return $this->librarian ? [
                    'id' => $this->librarian->id,
                    'first_name' => $this->librarian->first_name,
                    'last_name' => $this->librarian->last_name,
                    'full_name' => $this->librarian->first_name . ' ' . $this->librarian->last_name,
                ] : null;
            }),
            'date_borrowed' => $this->date_borrowed?->format('Y-m-d'),
            'due_date' => $this->due_date?->format('Y-m-d'),
            'date_returned' => $this->date_returned?->format('Y-m-d'),
            'status' => $this->status,
            'is_overdue' => $this->due_date && !$this->date_returned && $this->due_date->isPast(),
            'days_overdue' => $this->due_date && !$this->date_returned && $this->due_date->isPast()
                ? now()->diffInDays($this->due_date)
                : 0,
            'overdue_fine' => $this->whenLoaded('overdueFine', function () {
                return $this->overdueFine ? [
                    'id' => $this->overdueFine->id,
                    'amount' => $this->overdueFine->amount,
                    'status' => $this->overdueFine->status,
                    'settled_at' => $this->overdueFine->settled_at?->format('Y-m-d'),
                ] : null;
            }),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
