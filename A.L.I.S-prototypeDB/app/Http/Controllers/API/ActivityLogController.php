<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->get('user_id');
        $type = $request->get('action_type');
        $logs = ActivityLog::query()
            ->with('user')
            ->when($userId, fn($q) => $q->where('user_id', $userId))
            ->when($type, fn($q) => $q->where('action_type', $type))
            ->orderByDesc('date_time')
            ->paginate($request->integer('per_page', 15));
        return response()->json($logs);
    }

    public function show(ActivityLog $activity_log)
    {
        return response()->json($activity_log->load('user'));
    }
}
