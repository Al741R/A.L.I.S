<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BorrowTransaction extends Model
{
    use HasFactory;

    public const STATUS_BORROWED = 'Borrowed';
    public const STATUS_RETURNED = 'Returned';
    public const STATUS_OVERDUE = 'Overdue';
    public const STATUS_LOST = 'Lost';
    public const STATUS_RETURN_REQUESTED = 'ReturnRequested';

    protected $fillable = [
        'user_id',
        'book_id',
        'librarian_id',
        'date_borrowed',
        'due_date',
        'date_returned',
        'status',
    ];

    protected $casts = [
        'date_borrowed' => 'datetime',
        'due_date' => 'datetime',
        'date_returned' => 'datetime',
    ];

    public function borrower()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function librarian()
    {
        return $this->belongsTo(User::class, 'librarian_id');
    }

    public function book()
    {
        return $this->belongsTo(Book::class);
    }

    public function overdueFine()
    {
        return $this->hasOne(OverdueFine::class, 'transaction_id');
    }
}
