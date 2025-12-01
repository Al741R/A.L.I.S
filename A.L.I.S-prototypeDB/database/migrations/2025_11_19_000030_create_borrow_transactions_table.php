<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('borrow_transactions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->constrained('users')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('book_id')->constrained('books')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('librarian_id')->constrained('users')->cascadeOnUpdate()->restrictOnDelete();
            $table->dateTime('date_borrowed');
            $table->dateTime('due_date');
            $table->dateTime('date_returned')->nullable();
            $table->string('status');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('borrow_transactions');
    }
};
