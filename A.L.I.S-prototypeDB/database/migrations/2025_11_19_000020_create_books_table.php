<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('books', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('isbn')->index();
            $table->string('title');
            $table->string('author');
            $table->year('year_published');
            $table->text('description')->nullable();
            $table->string('cover_image')->nullable();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnUpdate()->restrictOnDelete();
            $table->unsignedInteger('total_copies');
            $table->unsignedInteger('available_copies');
            $table->dateTime('date_added');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};
