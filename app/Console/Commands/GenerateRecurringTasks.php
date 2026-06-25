<?php

namespace App\Console\Commands;

use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Console\Command;

class GenerateRecurringTasks extends Command
{
    protected $signature = 'tasks:generate-recurring';
    protected $description = 'Generate new task instances from recurring tasks';

    public function handle(): int
    {
        $tasks = Task::where('is_recurring', true)
            ->where(function ($q) {
                $q->whereNull('recurrence_end_date')
                    ->orWhere('recurrence_end_date', '>=', now()->toDateString());
            })
            ->get();

        $count = 0;

        foreach ($tasks as $task) {
            $lastGenerated = $this->getLastGeneratedDate($task);
            $nextDate = $this->getNextDate($task, $lastGenerated);

            if (!$nextDate) {
                continue;
            }

            if ($task->recurrence_end_date && $nextDate->isAfter($task->recurrence_end_date)) {
                continue;
            }

            $newTask = $task->replicate(['sort_order', 'created_by', 'created_at', 'updated_at', 'progress', 'status']);
            $newTask->status = 'not_started';
            $newTask->progress = 0;
            $newTask->is_recurring = false;
            $newTask->start_date = $nextDate;
            $newTask->due_date = $task->due_date
                ? Carbon::parse($task->due_date)->addDays($nextDate->diffInDays(Carbon::parse($task->start_date)))
                : null;
            $newTask->save();

            foreach ($task->subTasks as $subTask) {
                $newSubTask = $subTask->replicate(['task_id', 'sort_order', 'created_at', 'updated_at', 'progress', 'status']);
                $newSubTask->task_id = $newTask->id;
                $newSubTask->status = 'not_started';
                $newSubTask->progress = 0;
                $newSubTask->save();
            }

            $count++;
        }

        $this->info("Generated {$count} recurring task(s).");

        return Command::SUCCESS;
    }

    private function getLastGeneratedDate(Task $task): Carbon
    {
        $last = $task->project->tasks()
            ->where('name', $task->name)
            ->where('is_recurring', false)
            ->where('id', '!=', $task->id)
            ->latest('start_date')
            ->value('start_date');

        return $last ? Carbon::parse($last) : Carbon::parse($task->start_date);
    }

    private function getNextDate(Task $task, Carbon $lastDate): ?Carbon
    {
        $interval = $task->recurrence_interval ?? 1;

        return match ($task->recurrence_frequency) {
            'daily' => $lastDate->copy()->addDays($interval),
            'weekly' => $lastDate->copy()->addWeeks($interval),
            'monthly' => $lastDate->copy()->addMonths($interval),
            'yearly' => $lastDate->copy()->addYears($interval),
            default => null,
        };
    }
}
