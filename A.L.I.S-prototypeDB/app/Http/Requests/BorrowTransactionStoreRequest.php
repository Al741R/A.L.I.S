<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BorrowTransactionStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required','exists:users,id'],
            'book_id' => ['required','exists:books,id'],
            // librarian_id is derived from the authenticated user in controller
            'date_borrowed' => ['nullable','date'],
            'due_date' => ['required','date','after_or_equal:date_borrowed'],
        ];
    }
}
