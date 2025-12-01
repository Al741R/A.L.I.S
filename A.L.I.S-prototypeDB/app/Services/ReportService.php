<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Book;
use App\Models\BorrowTransaction;
use App\Models\OverdueFine;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ReportService
{
    private function groupExpr(string $column, string $gran): string
    {
        if ($gran === 'month') {
            $driver = DB::connection()->getDriverName();
            if ($driver === 'sqlite') {
                return "strftime('%Y-%m', $column)"; // SQLite monthly bucket
            }
            return "DATE_FORMAT($column, '%Y-%m')"; // MySQL/MariaDB
        }
        // Day granularity
        return "DATE($column)"; // Works for both MySQL and SQLite
    }
    private function makeRange(string $range): array
    {
        $range = strtolower($range ?: 'week');
        $end = Carbon::today();
        if ($range === 'month') {
            $start = (clone $end)->subDays(29);
            return [$start->startOfDay(), $end->endOfDay(), 'day'];
        }
        if ($range === 'year') {
            $start = (clone $end)->subMonthsNoOverflow(11)->startOfMonth();
            return [$start, $end->endOfDay(), 'month'];
        }
        // Week: Monday to Sunday (7 days)
        $dayOfWeek = $end->dayOfWeek; // 0=Sun, 1=Mon, ..., 6=Sat
        $daysFromMonday = ($dayOfWeek + 6) % 7; // Days since last Monday
        $start = (clone $end)->subDays($daysFromMonday)->startOfDay(); // Last Monday
        $weekEnd = (clone $start)->addDays(6)->endOfDay(); // Following Sunday
        return [$start, $weekEnd, 'day'];
    }

    private function makeBuckets(string $range): array
    {
        $range = strtolower($range ?: 'week');
        $end = Carbon::today();
        $keys = [];
        $labels = [];
        if ($range === 'year') {
            $cursor = (clone $end)->subMonthsNoOverflow(11)->startOfMonth();
            while ($cursor->lte($end)) {
                $keys[] = $cursor->format('Y-m');
                $labels[] = $cursor->format('M');
                $cursor->addMonth();
            }
        } else {
            if ($range === 'month') {
                $days = 30;
                $start = (clone $end)->subDays($days - 1);
            } else {
                // Week: Monday to Sunday (7 days)
                $dayOfWeek = $end->dayOfWeek;
                $daysFromMonday = ($dayOfWeek + 6) % 7;
                $start = (clone $end)->subDays($daysFromMonday);
                $days = 7;
            }
            $cursor = $start->copy();
            for ($i = 0; $i < $days; $i++) {
                $dateString = $cursor->toDateString();
                $keys[] = $dateString;
                // Return date strings as labels instead of day abbreviations
                // Frontend will format these for display
                $labels[] = $dateString;
                $cursor->addDay();
            }
        }
        return [$keys, $labels];
    }

    private function fillBuckets($rows, array $keys, array $labels, string $keyField = 'd', string $valueField = 'c'): array
    {
        $map = [];
        foreach ($rows as $r) {
            $map[$r->$keyField] = is_numeric($r->$valueField) ? 0 + $r->$valueField : $r->$valueField;
        }
        $values = [];
        foreach ($keys as $k) {
            $values[] = $map[$k] ?? 0;
        }
        return [$labels, $values];
    }

    public function weeklyBorrowing(string $range = 'week'): array
    {
        return Cache::remember("report:borrowing:$range", 300, function () use ($range) {
            [$start, $end, $gran] = $this->makeRange($range);
            $groupExpr = $this->groupExpr('date_borrowed', $gran);
            // Count only issued borrow events by date_borrowed within range
            // Exclude transactions without a borrow date
            $rows = BorrowTransaction::query()
                ->selectRaw("$groupExpr as d, COUNT(*) as c")
                ->whereNotNull('date_borrowed')
                ->whereBetween('date_borrowed', [$start, $end])
                ->groupBy(DB::raw($groupExpr))
                ->orderBy('d')
                ->get();
            [$keys, $labels] = $this->makeBuckets($range);
            [, $values] = $this->fillBuckets($rows, $keys, $labels);
            return compact('labels','values');
        });
    }

    public function weeklyReturns(string $range = 'week'): array
    {
        return Cache::remember("report:returns:$range", 300, function () use ($range) {
            [$start, $end, $gran] = $this->makeRange($range);
            $groupExpr = $this->groupExpr('date_returned', $gran);
            $rows = BorrowTransaction::query()
                ->selectRaw("$groupExpr as d, COUNT(*) as c")
                ->whereNotNull('date_returned')
                ->whereBetween('date_returned', [$start, $end])
                ->groupBy(DB::raw($groupExpr))
                ->orderBy('d')
                ->get();
            [$keys, $labels] = $this->makeBuckets($range);
            [, $values] = $this->fillBuckets($rows, $keys, $labels);
            return compact('labels','values');
        });
    }

    public function weeklyOverdues(string $range = 'week'): array
    {
        return Cache::remember("report:overdues:$range", 300, function () use ($range) {
            [$start, $end, $gran] = $this->makeRange($range);
            $groupExpr = $this->groupExpr('due_date', $gran);
            $rows = BorrowTransaction::query()
                ->selectRaw("$groupExpr as d, COUNT(*) as c")
                ->whereBetween('due_date', [$start, $end])
                ->where(function ($q) {
                    $q->whereNull('date_returned')
                      ->orWhereColumn('date_returned', '>', 'due_date');
                })
                ->groupBy(DB::raw($groupExpr))
                ->orderBy('d')
                ->get();
            [$keys, $labels] = $this->makeBuckets($range);
            [, $values] = $this->fillBuckets($rows, $keys, $labels);

            $unresolved = BorrowTransaction::query()
                ->with(['borrower','book'])
                ->whereNull('date_returned')
                ->where('due_date', '<', Carbon::now())
                ->orderBy('due_date')
                ->get();

            return [
                'labels' => $labels,
                'values' => $values,
                'unresolved' => $unresolved,
            ];
        });
    }

    public function weeklyFines(string $range = 'week'): array
    {
        return Cache::remember("report:fines:$range", 300, function () use ($range) {
            [$start, $end, $gran] = $this->makeRange($range);
            $groupExprCreated = $this->groupExpr('created_at', $gran);
            $groupExprSettled = $this->groupExpr('date_settled', $gran);

            $amounts = OverdueFine::query()
                ->selectRaw("$groupExprCreated as d, SUM(amount) as total")
                ->whereBetween('created_at', [$start, $end])
                ->groupBy(DB::raw($groupExprCreated))
                ->orderBy('d')
                ->get();

            [$keys, $labels] = $this->makeBuckets($range);
            // fill amount values
            $map = [];
            foreach ($amounts as $r) { $map[$r->d] = (float) $r->total; }
            $amountValues = [];
            foreach ($keys as $k) { $amountValues[] = $map[$k] ?? 0.0; }

            $settled = OverdueFine::query()
                ->selectRaw("$groupExprSettled as d, COUNT(*) as c")
                ->where('settled', true)
                ->whereNotNull('date_settled')
                ->whereBetween('date_settled', [$start, $end])
                ->groupBy(DB::raw($groupExprSettled))
                ->orderBy('d')
                ->get();
            [, $settledCounts] = $this->fillBuckets($settled, $keys, $labels);

            $unsettled = OverdueFine::query()
                ->selectRaw("$groupExprCreated as d, COUNT(*) as c")
                ->where('settled', false)
                ->whereBetween('created_at', [$start, $end])
                ->groupBy(DB::raw($groupExprCreated))
                ->orderBy('d')
                ->get();
            [, $unsettledCounts] = $this->fillBuckets($unsettled, $keys, $labels);

            return [
                'labels' => $labels,
                'amounts' => $amountValues,
                'settledCounts' => $settledCounts,
                'unsettledCounts' => $unsettledCounts,
            ];
        });
    }

    public function mostBorrowedBooksWeekly(int $limit = 5, string $range = 'week')
    {
        $limit = max(1, min(50, $limit));
        return Cache::remember("report:most-borrowed:$range:$limit", 300, function () use ($range, $limit) {
            [$start, $end] = array_slice($this->makeRange($range), 0, 2);
            // ignore granularity here; we just limit by date range
            $rows = BorrowTransaction::query()
                ->selectRaw('book_id, COUNT(*) as c')
                ->whereBetween('date_borrowed', [$start, $end])
                ->groupBy('book_id')
                ->orderByDesc('c')
                ->with('book')
                ->limit($limit)
                ->get();

            $data = [];
            foreach ($rows as $r) {
                if ($r->book) {
                    $data[] = [$r->book->title, (int) $r->c];
                }
            }
            return $data;
        });
    }

    public function weeklyUserActivity(array $actionTypes = [], string $range = 'week'): array
    {
        [$start, $end, $gran] = $this->makeRange($range);
        if (empty($actionTypes)) {
            $actionTypes = [
                'BOOK_CREATED','BOOK_UPDATED','BOOK_DELETED',
                'BORROW_ISSUED','BOOK_RETURNED',
                'REGISTER_BORROWER','REGISTER_LIBRARIAN',
            ];
        }
        $cacheKey = 'report:user-activity:'.strtolower($range).':'.md5(json_encode($actionTypes));
        return Cache::remember($cacheKey, 300, function () use ($gran, $start, $end, $range, $actionTypes) {
            $groupExpr = $this->groupExpr('date_time', $gran);
            $rows = ActivityLog::query()
                ->selectRaw("$groupExpr as d, action_type, COUNT(*) as c")
                ->whereBetween('date_time', [$start, $end])
                ->whereIn('action_type', $actionTypes)
                ->groupBy(DB::raw($groupExpr), 'action_type')
                ->orderBy('d')
                ->get();

            [$keys, $labels] = $this->makeBuckets($range);
            $series = [];
            foreach ($actionTypes as $type) {
                $series[$type] = array_fill(0, count($keys), 0);
            }
            $indexByDate = array_flip($keys);
            foreach ($rows as $r) {
                $idx = $indexByDate[$r->d] ?? null;
                if ($idx !== null) {
                    $series[$r->action_type][$idx] = (int) $r->c;
                }
            }

            $logs = ActivityLog::query()
                ->with('user')
                ->whereBetween('date_time', [$start, $end])
                ->whereIn('action_type', $actionTypes)
                ->orderByDesc('date_time')
                ->limit(200)
                ->get();

            return [
                'labels' => $labels,
                'series' => $series,
                'logs' => $logs,
            ];
        });
    }
}
