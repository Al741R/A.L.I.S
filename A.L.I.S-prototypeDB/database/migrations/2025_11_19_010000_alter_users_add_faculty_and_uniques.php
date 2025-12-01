<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'faculty_number')) {
                $table->string('faculty_number')->nullable()->after('student_number');
            }
            // add unique indexes (MySQL allows multiple NULLs)
            if (!Schema::hasColumn('users', 'student_number')) {
                $table->string('student_number')->nullable()->after('role_id');
            }
            if (!Schema::hasColumn('users', 'employee_number')) {
                $table->string('employee_number')->nullable()->after('faculty_number');
            }
        });

        // separate index operations for clarity
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'student_number')) return; // safety
            $table->unique('student_number', 'users_student_number_unique');
            $table->unique('faculty_number', 'users_faculty_number_unique');
            $table->unique('employee_number', 'users_employee_number_unique');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // drop uniques if exist
            try { $table->dropUnique('users_student_number_unique'); } catch (\Throwable $e) {}
            try { $table->dropUnique('users_faculty_number_unique'); } catch (\Throwable $e) {}
            try { $table->dropUnique('users_employee_number_unique'); } catch (\Throwable $e) {}

            if (Schema::hasColumn('users', 'faculty_number')) {
                $table->dropColumn('faculty_number');
            }
        });
    }
};
