<?php

namespace App\Http\Controllers;

use App\Models\Phase;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PhaseController extends Controller
{
    public function index(Project $project)
    {
        $phases = $project->phases()->withCount('tasks')->get();

        return response()->json($phases);
    }

    public function store(Request $request, Project $project): RedirectResponse
    {
        $this->authorize('create', Phase::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:' . config('validation.name_max')],
            'description' => ['nullable', 'string', 'max:' . config('validation.description_max')],
            'status' => ['nullable', 'string', 'in:not_started,in_progress,review,done'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $validated['sort_order'] = $project->phases()->count();

        $project->phases()->create($validated);

        return back()->with('success', __('Phase created.'));
    }

    public function update(Request $request, Project $project, Phase $phase): RedirectResponse
    {
        abort_if($request->user()->isClient(), 403);
        $this->authorize('update', $phase);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:' . config('validation.name_max')],
            'description' => ['nullable', 'string', 'max:' . config('validation.description_max')],
            'status' => ['nullable', 'string', 'in:not_started,in_progress,review,done'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $phase->update($validated);

        return back()->with('success', __('Phase updated.'));
    }

    public function destroy(Project $project, Phase $phase): RedirectResponse
    {
        $this->authorize('delete', $phase);

        DB::transaction(function () use ($project, $phase) {
            $phase->delete();

            $project->recalculateProgressFromPhases();
        });

        return back()->with('success', __('Phase deleted.'));
    }
}
