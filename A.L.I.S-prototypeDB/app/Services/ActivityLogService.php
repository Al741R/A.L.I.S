<?php

namespace App\Services;

use App\Models\ActivityLog;

class ActivityLogService
{
    public static function log(int $userId, string $type, string $description, $at = null): void
    {
        ActivityLog::create([
            'user_id' => $userId,
            'action_type' => $type,
            'description' => $description,
            'date_time' => $at ?? now(),
        ]);
    }
}
