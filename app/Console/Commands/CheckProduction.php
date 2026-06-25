<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckProduction extends Command
{
    protected $signature = 'production:check';
    protected $description = 'Validate production environment configuration';

    public function handle(): int
    {
        $checks = [];

        $checks[] = $this->check('APP_ENV=production', fn() =>
            config('app.env') === 'production' ? 'ok' : 'warn (env is ' . config('app.env') . ')'
        );

        $checks[] = $this->check('APP_DEBUG=false', fn() =>
            config('app.debug') ? 'fail' : 'ok'
        );

        $checks[] = $this->check('APP_KEY set', fn() =>
            config('app.key') && config('app.key') !== 'base64:...' ? 'ok' : 'fail'
        );

        $checks[] = $this->check('APP_URL set', fn() =>
            config('app.url') && config('app.url') !== 'http://localhost' ? 'ok' : 'warn'
        );

        $checks[] = $this->check('FRONTEND_URL set', fn() =>
            config('cors.allowed_origins') && count(config('cors.allowed_origins')) > 0 ? 'ok' : 'warn'
        );

        $checks[] = $this->check('Database connected', function () {
            try {
                DB::connection()->getPdo();
                return 'ok';
            } catch (\Exception $e) {
                return 'fail (' . $e->getMessage() . ')';
            }
        });

        $checks[] = $this->check('QUEUE_CONNECTION=database', fn() =>
            config('queue.default') === 'database' ? 'ok' : 'warn'
        );

        $checks[] = $this->check('SESSION_DRIVER=database', fn() =>
            config('session.driver') === 'database' ? 'ok' : 'warn'
        );

        $checks[] = $this->check('CACHE_STORE=database', fn() =>
            config('cache.default') === 'database' ? 'ok' : 'warn'
        );

        $checks[] = $this->check('HTTPS in production', fn() =>
            config('app.env') !== 'production' || config('session.secure') ? 'ok' : 'warn (session.secure not set)'
        );

        $checks[] = $this->check('LOG_STACK=daily (log rotation)', fn() =>
            config('app.env') !== 'production' || config('logging.default') === 'daily' || str_contains((string) config('logging.default'), 'daily')
            ? 'ok'
            : 'warn (LOG_STACK should be daily to rotate logs)'
        );

        $checks[] = $this->check('SESSION_SECURE_COOKIE=true', fn() =>
            config('app.env') !== 'production' || config('session.secure') ? 'ok' : 'warn (cookies not marked secure)'
        );

        $checks[] = $this->check('APP_TIMEZONE set', fn() =>
            config('app.timezone') ? 'ok' : 'warn (timezone not set)'
        );

        $checks[] = $this->check('Storage link exists', function () {
            $link = public_path('storage');
            return is_link($link) || is_dir($link) ? 'ok' : 'warn (run: php artisan storage:link)';
        });

        $checks[] = $this->check('Redis available (optional)', function () {
            if (! class_exists('\Illuminate\Support\Facades\Redis') || ! extension_loaded('redis') && ! class_exists('\Predis\Client')) {
                return config('app.env') !== 'production' ? 'ok (not required in non-prod)' : 'warn (no Redis client installed)';
            }
            try {
                \Illuminate\Support\Facades\Redis::connection()->ping();
                return 'ok';
            } catch (\Exception $e) {
                return config('app.env') !== 'production' ? 'ok (not required in non-prod)' : 'warn (redis not reachable: ' . $e->getMessage() . ')';
            }
        });

        foreach ($checks as $check) {
            $status = $check['status'];
            $label = $status === 'ok' ? '<fg=green>PASS</>' : ($status === 'warn' ? '<fg=yellow>WARN</>' : '<fg=red>FAIL</>');
            $this->line("  {$label} {$check['label']}");
            if ($status !== 'ok') {
                $this->line("         {$check['message']}");
            }
        }

        return Command::SUCCESS;
    }

    private function check(string $label, callable $fn): array
    {
        $result = $fn();
        if (is_string($result) && str_starts_with($result, 'ok')) {
            return ['label' => $label, 'status' => 'ok', 'message' => ''];
        }
        if (is_string($result) && str_starts_with($result, 'warn')) {
            return ['label' => $label, 'status' => 'warn', 'message' => substr($result, 5)];
        }
        return ['label' => $label, 'status' => 'fail', 'message' => substr($result, 5)];
    }
}
