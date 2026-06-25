<?php

namespace App\Observers;

use App\Models\Phase;

class PhaseObserver
{
    public function saved(Phase $phase): void
    {
        $phase->load('project');
        if ($phase->project) {
            $phase->project->recalculateProgressFromPhases();
        }
    }

    public function deleted(Phase $phase): void
    {
        $phase->load('project');
        if ($phase->project) {
            $phase->project->recalculateProgressFromPhases();
        }
    }
}
