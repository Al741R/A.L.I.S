<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    // Adjust origins if using custom host (e.g. http://alisfe.test:5173)
    'allowed_origins' => [
        env('ALIS_FRONTEND_ORIGIN', 'http://localhost:5173'),
        'http://127.0.0.1:5173',
        'http://[::1]:5173', // IPv6 localhost for browsers resolving localhost to ::1
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
