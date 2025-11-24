<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\BorrowTransaction;
use App\Services\ActivityLogService;
use Illuminate\Support\Facades\DB;

class MarkOverdueTransactions extends Command
{
    protected $signature = 'borrow:mark-overdue';
    protected $description = 'Mark borrow transactions past due date as Overdue and log activity';

    public function handle(): int
    {
        $now = now();
        $count = 0;
        DB::transaction(function () use (&$count, $now) {
            $rows = BorrowTransaction::query()
                ->whereNull('date_returned')
                ->where('status', BorrowTransaction::STATUS_BORROWED)
                ->where('due_date', '<', $now)
                ->lockForUpdate()
                ->get();
            foreach ($rows as $tx) {
                $tx->status = BorrowTransaction::STATUS_OVERDUE;
                $tx->save();
                ActivityLogService::log($tx->librarian_id ?? $tx->user_id, 'BORROW_MARKED_OVERDUE', 'Marked overdue transaction ID '.$tx->id);
                $count++;
            }
        });
        $this->info("Overdue transactions marked: $count");
        return Command::SUCCESS;
    }
}
