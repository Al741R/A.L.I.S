<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private ReportService $service) {}

    private function addPairs(array $block): array
    {
        // borrowing / returns / overdues simple label+values
        if (isset($block['labels']) && isset($block['values'])) {
            $pairs = [];
            foreach ($block['labels'] as $i => $label) {
                $pairs[] = ['label' => $label, 'value' => $block['values'][$i] ?? 0];
            }
            $block['pairs'] = $pairs;
        }
        // fines: labels + multiple count arrays
        if (isset($block['labels']) && isset($block['amounts'])) {
            $pairs = [];
            foreach ($block['labels'] as $i => $label) {
                $pairs[] = [
                    'label' => $label,
                    'amount' => $block['amounts'][$i] ?? 0.0,
                    'settled' => $block['settledCounts'][$i] ?? 0,
                    'unsettled' => $block['unsettledCounts'][$i] ?? 0,
                ];
            }
            $block['pairs'] = $pairs;
        }
        // userActivity: labels + series associative
        if (isset($block['labels']) && isset($block['series'])) {
            $pairs = [];
            foreach ($block['labels'] as $i => $label) {
                $row = ['label' => $label];
                foreach ($block['series'] as $type => $values) {
                    $row[$type] = $values[$i] ?? 0;
                }
                $pairs[] = $row;
            }
            $block['pairs'] = $pairs;
        }
        return $block;
    }

    public function weeklyBorrowing(Request $request)
    {
        $range = $request->query('range', 'week');
        return response()->json($this->service->weeklyBorrowing($range));
    }

    public function weeklyReturns(Request $request)
    {
        $range = $request->query('range', 'week');
        return response()->json($this->service->weeklyReturns($range));
    }

    public function weeklyOverdues(Request $request)
    {
        $range = $request->query('range', 'week');
        return response()->json($this->service->weeklyOverdues($range));
    }

    public function weeklyFines(Request $request)
    {
        $range = $request->query('range', 'week');
        return response()->json($this->service->weeklyFines($range));
    }

    public function mostBorrowed(Request $request)
    {
        $limit = (int) $request->query('limit', 5);
        $limit = max(1, min(50, $limit));
        $range = $request->query('range', 'week');
        return response()->json($this->service->mostBorrowedBooksWeekly($limit, $range));
    }

    public function weeklyUserActivity(Request $request)
    {
        $types = $request->query('types');
        $types = is_string($types) ? array_filter(array_map('trim', explode(',', $types))) : [];
        $range = $request->query('range', 'week');
        return response()->json($this->service->weeklyUserActivity($types, $range));
    }

    public function weeklySummary(Request $request)
    {
        $range = $request->query('range', 'week');
        return response()->json([
            'borrowing' => $this->service->weeklyBorrowing($range),
            'returns' => $this->service->weeklyReturns($range),
            'overdues' => $this->service->weeklyOverdues($range),
            'fines' => $this->service->weeklyFines($range),
            'mostBorrowed' => $this->service->mostBorrowedBooksWeekly((int) $request->query('limit', 5), $range),
            'userActivity' => $this->service->weeklyUserActivity([], $range),
        ]);
    }

    // Aggregated dashboard: returns data for week, month, and year in one response.
    public function dashboard(Request $request)
    {
        $limit = (int) $request->query('limit', 5);
        $limit = max(1, min(50, $limit));
        $typesRaw = $request->query('types');
        $types = is_string($typesRaw) ? array_filter(array_map('trim', explode(',', $typesRaw))) : [];
        $ranges = ['week','month','year'];
        $payload = [];
        $layout = $request->query('layout');
        foreach ($ranges as $r) {
            $block = [
                'borrowing' => $this->service->weeklyBorrowing($r),
                'returns' => $this->service->weeklyReturns($r),
                'overdues' => $this->service->weeklyOverdues($r),
                'fines' => $this->service->weeklyFines($r),
                'mostBorrowed' => $this->service->mostBorrowedBooksWeekly($limit, $r),
                'userActivity' => $this->service->weeklyUserActivity($types, $r),
            ];
            if ($layout === 'pairs') {
                foreach ($block as $k => $v) {
                    if (is_array($v)) {
                        $block[$k] = $this->addPairs($v);
                    }
                }
            }
            $payload[$r] = $block;
        }
        return response()->json($payload);
    }
}
