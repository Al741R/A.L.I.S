<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OverdueFineUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => ['sometimes','numeric','min:0'],
            'settled' => ['sometimes','boolean'],
            'date_settled' => ['nullable','date'],
        ];
    }
}
