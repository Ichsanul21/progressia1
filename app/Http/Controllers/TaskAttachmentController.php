<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskAttachment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TaskAttachmentController extends Controller
{
    public function store(Request $request, $project, Task $task): RedirectResponse
    {
        $this->authorize('update', $task);

        $user = $request->user();

        if ($user->canBypassPhotoRequirement()) {
            $rules['file'] = [
                'required',
                'file',
                'mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx,zip,rar,txt,csv',
                'max:' . config('validation.file_max'),
            ];
        } else {
            $rules['file'] = [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:' . config('validation.photo_max'),
            ];
        }

        $validated = $request->validate($rules);

        $file = $request->file('file');
        $filename = time() . '_' . $file->hashName();
        $path = $file->storeAs('task-attachments', $filename, 'public');

        if (str_starts_with($file->getMimeType(), 'image/')) {
            \App\Support\ImageSanitizer::sanitize($file, Storage::disk('public')->path($path));
        }

        $task->attachments()->create([
            'filename' => $filename,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'uploaded_by' => $user->id,
        ]);

        return back()->with('success', __('File uploaded.'));
    }

    public function download($project, Task $task, TaskAttachment $attachment): StreamedResponse|RedirectResponse
    {
        $this->authorize('view', $task);

        if (! Storage::disk('public')->exists("task-attachments/{$attachment->filename}")) {
            return back()->with('error', __('File not found.'));
        }

        return Storage::disk('public')->download("task-attachments/{$attachment->filename}", $attachment->original_filename);
    }

    public function destroy($project, Task $task, TaskAttachment $attachment): RedirectResponse
    {
        $this->authorize('update', $task);

        Storage::disk('public')->delete("task-attachments/{$attachment->filename}");
        $attachment->delete();

        return back()->with('success', __('File deleted.'));
    }
}