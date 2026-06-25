<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function store(Request $request, Project $project): RedirectResponse
    {
        $this->authorize('create', [Document::class, $project]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:' . config('validation.name_max')],
            'category' => ['nullable', 'string', 'in:contract,drawing,report,permit,other'],
            'file' => ['required', 'file', 'mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png,zip,rar,txt,csv', 'max:' . config('validation.file_max')],
        ]);

        $file = $request->file('file');

        $path = $file->store('documents/' . $project->id, 'public');

        $project->documents()->create([
            'name' => $validated['name'],
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'category' => $validated['category'] ?? 'other',
            'version' => 1,
            'uploaded_by' => $request->user()->id,
            'vendor_id' => $project->vendor_id,
        ]);

        return back()->with('success', __('Document uploaded.'));
    }

    public function download(Project $project, Document $document): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $this->authorize('download', $document);

        if (! Storage::disk('public')->exists($document->file_path)) {
            return back()->with('error', __('File not found.'));
        }

        return Storage::disk('public')->download($document->file_path, $document->name);
    }

    public function destroy(Project $project, Document $document): RedirectResponse
    {
        $this->authorize('delete', $document);

        Storage::disk('public')->delete($document->file_path);
        $document->delete();

        return back()->with('success', __('Document deleted.'));
    }
}
