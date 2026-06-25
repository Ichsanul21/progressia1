<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TaskCommentController extends Controller
{
    public function store(Request $request, Project $project, Task $task): RedirectResponse
    {
        $this->authorize('view', $project);

        $validated = $request->validate([
            'content' => ['required', 'string', 'max:' . config('validation.content_max')],
        ]);

        $comment = $task->comments()->create([
            'user_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        $mentions = $this->extractMentions($validated['content']);
        foreach ($mentions as $username) {
            $mentioned = User::where('name', $username)->first();
            if ($mentioned && $mentioned->id !== $request->user()->id) {
                Notification::create([
                    'user_id' => $mentioned->id,
                    'type' => 'mention',
                    'title' => 'You were mentioned',
                    'body' => $request->user()->name . " mentioned you in \"{$task->name}\": " . str($validated['content'])->limit(100),
                    'data' => [
                        'project_id' => $project->id,
                        'task_id' => $task->id,
                        'comment_id' => $comment->id,
                    ],
                ]);
            }
        }

        return back()->with('success', __('Comment added.'));
    }

    public function destroy(Project $project, Task $task, TaskComment $comment): RedirectResponse
    {
        $this->authorize('update', $task);

        $comment->delete();

        return back()->with('success', __('Comment deleted.'));
    }

    private function extractMentions(string $content): array
    {
        preg_match_all('/@(\w+[\s]?\w*)/', $content, $matches);
        return array_unique(array_map('trim', $matches[1] ?? []));
    }
}
