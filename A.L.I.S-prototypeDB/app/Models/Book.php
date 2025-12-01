<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    use HasFactory;

    protected $fillable = [
        'isbn',
        'title',
        'author',
        'year_published',
        'description',
        'cover_image',
        'category_id',
        'total_copies',
        'available_copies',
        'date_added',
    ];

    // Automatically include computed status in JSON
    protected $appends = ['status', 'borrowed_count'];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function borrowTransactions()
    {
        return $this->hasMany(BorrowTransaction::class);
    }

    // Computed availability status based on available_copies
    public function getStatusAttribute(): string
    {
        return ($this->available_copies > 0) ? 'Available' : 'Unavailable';
    }

    // Computed borrowed count based on total_copies and available_copies
    public function getBorrowedCountAttribute(): int
    {
        return max(0, (int)$this->total_copies - (int)$this->available_copies);
    }

    // Query scopes for convenience
    public function scopeAvailable($query)
    {
        return $query->where('available_copies', '>', 0);
    }

    public function scopeUnavailable($query)
    {
        return $query->where('available_copies', 0);
    }
}
