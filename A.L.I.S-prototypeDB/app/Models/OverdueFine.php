<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OverdueFine extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id',
        'amount',
        'settled',
        'date_settled',
    ];

    public function transaction()
    {
        return $this->belongsTo(BorrowTransaction::class, 'transaction_id');
    }
}
