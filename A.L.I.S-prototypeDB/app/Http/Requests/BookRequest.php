<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'isbn' => ['required','string','max:64'],
            'title' => ['required','string','max:255'],
            'author' => ['required','string','max:255'],
            'year_published' => ['required','integer','digits:4','min:0'],
            'description' => ['nullable','string'],
            'cover_image' => ['nullable','string','max:255'],
            'category_id' => ['required','exists:categories,id'],
            'total_copies' => ['required','integer','min:0'],
            'available_copies' => ['required','integer','min:0','lte:total_copies'],
            'date_added' => ['required','date'],
        ];
    }
}
