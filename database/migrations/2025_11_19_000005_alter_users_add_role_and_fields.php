<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop default 'name' if it exists in this project scaffold
            if (Schema::hasColumn('users', 'name')) {
                $table->dropColumn('name');
            }

            $table->foreignId('role_id')
                ->after('id')
                ->constrained('roles')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string('student_number')->nullable()->after('role_id');
            $table->string('employee_number')->nullable()->after('student_number');
            $table->string('first_name')->after('employee_number');
            $table->string('last_name')->after('first_name');
            $table->string('status')->default('Active')->after('password');
            $table->dateTime('date_registered')->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'role_id')) {
                $table->dropConstrainedForeignId('role_id');
            }
            foreach (['student_number','employee_number','first_name','last_name','status','date_registered'] as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $table->dropColumn($col);
                }
            }

            // Optionally restore 'name' column on rollback
            if (!Schema::hasColumn('users', 'name')) {
                $table->string('name')->nullable();
            }
        });
    }
};
