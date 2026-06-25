<?php

namespace App\Providers;

use App\Models\Approval;
use App\Models\Document;
use App\Models\Phase;
use App\Models\Project;
use App\Models\Registrant;
use App\Models\SubTask;
use App\Models\SubVendor;
use App\Models\Task;
use App\Models\User;
use App\Models\Vendor;
use App\Observers\PhaseObserver;
use App\Observers\ProjectObserver;
use App\Observers\SubTaskObserver;
use App\Observers\TaskObserver;
use App\Policies\ApprovalPolicy;
use App\Policies\DocumentPolicy;
use App\Policies\PhasePolicy;
use App\Policies\ProjectPolicy;
use App\Policies\RegistrantPolicy;
use App\Policies\SubTaskPolicy;
use App\Policies\SubVendorPolicy;
use App\Policies\TaskPolicy;
use App\Policies\UserPolicy;
use App\Policies\VendorPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }

        RateLimiter::for('web', function (Request $request) {
            return $request->user()
                ? Limit::perMinute(300)->by($request->user()->id)
                : Limit::perMinute(60)->by($request->ip());
        });

        Gate::policy(Approval::class, ApprovalPolicy::class);
        Gate::policy(Document::class, DocumentPolicy::class);
        Gate::policy(Phase::class, PhasePolicy::class);
        Gate::define('view-approvals', fn($user) => $user->isAdminOrAbove());
        Gate::policy(Project::class, ProjectPolicy::class);
        Gate::policy(Registrant::class, RegistrantPolicy::class);
        Gate::policy(SubTask::class, SubTaskPolicy::class);
        Gate::policy(Task::class, TaskPolicy::class);
        Gate::policy(SubVendor::class, SubVendorPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Vendor::class, VendorPolicy::class);

        Project::observe(ProjectObserver::class);
        Phase::observe(PhaseObserver::class);
        Task::observe(TaskObserver::class);
        SubTask::observe(SubTaskObserver::class);

        Vendor::deleting(function (Vendor $vendor) {
            $query = User::where('vendor_id', $vendor->id);
            if ($vendor->isForceDeleting()) {
                $query->forceDelete();
            } else {
                $query->delete();
            }
        });

        Vendor::restoring(function (Vendor $vendor) {
            User::withTrashed()
                ->where('vendor_id', $vendor->id)
                ->restore();
        });
    }
}
