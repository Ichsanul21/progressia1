<?php

namespace App\Observers;

use App\Models\Project;

class ProjectObserver
{
    public function saved(Project $project): void
    {
        if ($project->wasChanged('status') && $project->status === 'not_started') {
            $project->updateQuietly(['progress' => 0]);
            return;
        }
        $project->recalculateProgress();
    }

    public function deleted(Project $project): void
    {
        $project->recalculateProgress();
    }
}
