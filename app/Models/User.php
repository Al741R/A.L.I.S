<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public const STATUS_ACTIVE = 'Active';
    public const STATUS_INACTIVE = 'Inactive';

    public const ROLE_ADMIN = 'Admin';
    public const ROLE_LIBRARIAN = 'Librarian';
    public const ROLE_BORROWER = 'Borrower';
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'role_id',
        'student_number',
        'faculty_number',
        'employee_number',
        'first_name',
        'last_name',
        'email',
        'password',
        'status',
        'date_registered',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'date_registered' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function borrowTransactions()
    {
        return $this->hasMany(BorrowTransaction::class, 'user_id');
    }

    public function processedBorrowTransactions()
    {
        return $this->hasMany(BorrowTransaction::class, 'librarian_id');
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    // Role helpers
    public function isAdmin(): bool
    {
        return $this->role?->role_name === self::ROLE_ADMIN;
    }

    public function isLibrarian(): bool
    {
        return $this->role?->role_name === self::ROLE_LIBRARIAN;
    }

    public function isBorrower(): bool
    {
        return $this->role?->role_name === self::ROLE_BORROWER;
    }
}
