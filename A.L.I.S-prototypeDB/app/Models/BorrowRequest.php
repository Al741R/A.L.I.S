<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BorrowRequest extends Model
{
    use HasFactory;

    const STATUS_PENDING = 'Pending';
    const STATUS_APPROVED = 'Approved';
    const STATUS_DENIED = 'Denied';
    const STATUS_CANCELLED = 'Cancelled';

    protected $fillable = [
        'user_id','book_id','librarian_id','status','approved_at','denied_at'
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'denied_at' => 'datetime',
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
}
