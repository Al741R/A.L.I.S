<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('borrow_transactions', function (Blueprint $table) {
            $table->index('date_borrowed', 'bt_date_borrowed_idx');
            $table->index('due_date', 'bt_due_date_idx');
            $table->index('date_returned', 'bt_date_returned_idx');
        });

        Schema::table('overdue_fines', function (Blueprint $table) {
            $table->index('created_at', 'of_created_at_idx');
            $table->index('date_settled', 'of_date_settled_idx');
            $table->index('settled', 'of_settled_idx');
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index('date_time', 'al_date_time_idx');
            $table->index('action_type', 'al_action_type_idx');
            $table->index('user_id', 'al_user_id_idx');
        });
    }

    public function down(): void
    {
        Schema::table('borrow_transactions', function (Blueprint $table) {
            $table->dropIndex('bt_date_borrowed_idx');
            $table->dropIndex('bt_due_date_idx');
            $table->dropIndex('bt_date_returned_idx');
        });

        Schema::table('overdue_fines', function (Blueprint $table) {
            $table->dropIndex('of_created_at_idx');
            $table->dropIndex('of_date_settled_idx');
            $table->dropIndex('of_settled_idx');
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex('al_date_time_idx');
            $table->dropIndex('al_action_type_idx');
            $table->dropIndex('al_user_id_idx');
        });
    }
};
