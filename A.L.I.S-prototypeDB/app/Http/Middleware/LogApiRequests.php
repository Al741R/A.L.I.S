<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogApiRequests
{
    /**
     * Handle an incoming request and log API details
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);

        // Log incoming request
        $this->logRequest($request);

        // Process the request
        $response = $next($request);

        // Calculate response time
        $duration = round((microtime(true) - $startTime) * 1000, 2); // milliseconds

        // Log response
        $this->logResponse($request, $response, $duration);

        return $response;
    }

    /**
     * Log incoming request details
     */
    protected function logRequest(Request $request): void
    {
        // Skip logging for health checks and OPTIONS requests
        if ($this->shouldSkipLogging($request)) {
            return;
        }

        $user = $request->user();
        $context = [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'user_id' => $user?->id,
            'user_email' => $user?->email,
        ];

        // Log request body for non-GET requests (excluding sensitive data)
        if (!$request->isMethod('GET') && $request->getContent()) {
            $body = $request->except(['password', 'password_confirmation', 'token', 'current_password']);
            $context['body'] = $body;
        }

        Log::channel('daily')->info('API Request', $context);
    }

    /**
     * Log response details
     */
    protected function logResponse(Request $request, Response $response, float $duration): void
    {
        if ($this->shouldSkipLogging($request)) {
            return;
        }

        $user = $request->user();
        $context = [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'status' => $response->getStatusCode(),
            'duration_ms' => $duration,
            'user_id' => $user?->id,
        ];

        // Log level based on status code
        $level = 'info';
        if ($response->getStatusCode() >= 500) {
            $level = 'error';
        } elseif ($response->getStatusCode() >= 400) {
            $level = 'warning';
        }

        Log::channel('daily')->{$level}('API Response', $context);

        // Log slow requests (>1000ms)
        if ($duration > 1000) {
            Log::channel('daily')->warning('Slow API Request', array_merge($context, [
                'threshold' => '1000ms',
                'actual' => "{$duration}ms",
            ]));
        }
    }

    /**
     * Determine if request should skip logging
     */
    protected function shouldSkipLogging(Request $request): bool
    {
        $skipPaths = [
            '/up',
            '/health',
            'api/v1/auth/me', // Skip frequent auth checks
        ];

        $path = $request->path();

        foreach ($skipPaths as $skipPath) {
            if (str_contains($path, $skipPath)) {
                return true;
            }
        }

        // Skip OPTIONS requests
        return $request->isMethod('OPTIONS');
    }
}
