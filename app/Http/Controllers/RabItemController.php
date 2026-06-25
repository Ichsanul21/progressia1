<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\RabItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class RabItemController extends Controller
{
    public function index(Request $request, Project $project): Response
    {
        $this->authorize('view', $project);

        $items = $project->rabItems()->with('phase:id,name')->orderBy('sort_order')->get();

        $totalBudget = $items->sum(fn($i) => $i->volume * $i->unit_price);
        $totalRealization = $items->sum('realization');

        return Inertia::render('rab/index', [
            'project' => $project->loadCount('phases', 'tasks', 'documents'),
            'items' => $items,
            'phases' => $project->phases()->orderBy('sort_order')->get(['id', 'name']),
            'totalBudget' => round($totalBudget, 2),
            'totalRealization' => round($totalRealization, 2),
            'canDelete' => $request->user()->can('update', $project),
        ]);
    }

    public function store(Request $request, Project $project): RedirectResponse
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'code' => ['nullable', 'string', 'max:' . config('validation.code_max')],
            'name' => ['required', 'string', 'max:' . config('validation.name_max')],
            'description' => ['nullable', 'string', 'max:' . config('validation.description_max')],
            'unit' => ['required', 'string', 'max:' . config('validation.unit_max')],
            'volume' => ['required', 'numeric', 'min:0'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'phase_id' => ['nullable', 'exists:phases,id'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $validated['sort_order'] ??= $project->rabItems()->count();
        $project->rabItems()->create($validated);

        return redirect()
            ->route('projects.rab.index', array_merge(['project' => $project], Arr::only($request->query(), ['search', 'phase_id'])))
            ->with('success', __('RAB item created.'));
    }

    public function update(Request $request, Project $project, RabItem $rabItem): RedirectResponse
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'code' => ['nullable', 'string', 'max:' . config('validation.code_max')],
            'name' => ['required', 'string', 'max:' . config('validation.name_max')],
            'description' => ['nullable', 'string', 'max:' . config('validation.description_max')],
            'unit' => ['required', 'string', 'max:' . config('validation.unit_max')],
            'volume' => ['required', 'numeric', 'min:0'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'realization' => ['nullable', 'numeric', 'min:0'],
            'phase_id' => ['nullable', 'exists:phases,id'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $rabItem->update($validated);

        return redirect()
            ->route('projects.rab.index', array_merge(['project' => $project], Arr::only($request->query(), ['search', 'phase_id'])))
            ->with('success', __('RAB item updated.'));
    }

    public function destroy(Request $request, Project $project, RabItem $rabItem): RedirectResponse
    {
        $this->authorize('update', $project);

        $rabItem->delete();

        return redirect()
            ->route('projects.rab.index', array_merge(['project' => $project], Arr::only($request->query(), ['search', 'phase_id'])))
            ->with('success', __('RAB item deleted.'));
    }

    public function import(Request $request, Project $project): RedirectResponse
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:' . config('validation.import_max')],
        ]);

        $spreadsheet = IOFactory::load($validated['file']->getPathname());
        $worksheet = $spreadsheet->getActiveSheet();
        $rows = $worksheet->toArray();

        if (count($rows) < 2) {
            return back()->with('error', __('File is empty.'));
        }

        $header = array_map('trim', $rows[0]);
        $expected = ['code', 'name', 'unit', 'volume', 'unit_price'];
        $headerMap = [];
        foreach ($expected as $field) {
            $idx = array_search($field, $header);
            if ($idx === false) {
                $idx = array_search(ucfirst($field), $header);
            }
            if ($idx === false) {
                return back()->with('error', __("Column ':field' not found in file.", ['field' => $field]));
            }
            $headerMap[$field] = $idx;
        }

        $imported = 0;
        $errors = [];
        $sortOrder = $project->rabItems()->count();

        DB::transaction(function () use ($project, $rows, $headerMap, &$imported, &$errors, &$sortOrder) {
        foreach (array_slice($rows, 1) as $line => $row) {
            $rowNum = $line + 2;
            $data = [
                'code' => trim($row[$headerMap['code']] ?? ''),
                'name' => trim($row[$headerMap['name']] ?? ''),
                'unit' => trim($row[$headerMap['unit']] ?? ''),
                'volume' => $row[$headerMap['volume']] ?? 0,
                'unit_price' => $row[$headerMap['unit_price']] ?? 0,
            ];

            if (empty($data['name'])) {
                $errors[] = "Row {$rowNum}: name is required.";
                continue;
            }
            if (empty($data['unit'])) {
                $errors[] = "Row {$rowNum}: unit is required.";
                continue;
            }
            if (!is_numeric($data['volume']) || $data['volume'] < 0) {
                $errors[] = "Row {$rowNum}: volume must be a positive number.";
                continue;
            }
            if (!is_numeric($data['unit_price']) || $data['unit_price'] < 0) {
                $errors[] = "Row {$rowNum}: unit price must be a positive number.";
                continue;
            }

            $project->rabItems()->create([
                'project_id' => $project->id,
                'code' => $data['code'] ?: null,
                'name' => $data['name'],
                'unit' => $data['unit'],
                'volume' => (float) $data['volume'],
                'unit_price' => (float) $data['unit_price'],
                'sort_order' => $sortOrder++,
            ]);
            $imported++;
        }
        });

        $message = "{$imported} items imported.";
        if (!empty($errors)) {
            $message .= ' Errors: ' . implode('; ', array_slice($errors, 0, 10));
            if (count($errors) > 10) {
                $message .= ' (...and ' . (count($errors) - 10) . ' more)';
            }
        }

        return back()->with('success', __($message));
    }

    public function exportTemplate(Project $project)
    {
        $this->authorize('view', $project);

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('RAB Template');

        $headers = ['code', 'name', 'unit', 'volume', 'unit_price'];
        $sheet->fromArray([$headers], null, 'A1');
        $sheet->fromArray([
            ['1.1', 'Example Work Item', 'm2', '100', '50000'],
        ], null, 'A2');

        foreach (range('A', 'E') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'rab-template.xlsx';
        $tempPath = Storage::disk('local')->path($filename);
        $writer->save($tempPath);

        return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
    }

    public function export(Project $project)
    {
        $this->authorize('view', $project);

        $items = $project->rabItems()->orderBy('sort_order')->get();

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('RAB');

        $headers = ['code', 'name', 'unit', 'volume', 'unit_price', 'total', 'realization'];
        $sheet->fromArray([$headers], null, 'A1');

        $row = 2;
        foreach ($items as $item) {
            $sheet->setCellValue('A' . $row, $item->code);
            $sheet->setCellValue('B' . $row, $item->name);
            $sheet->setCellValue('C' . $row, $item->unit);
            $sheet->setCellValue('D' . $row, $item->volume);
            $sheet->setCellValue('E' . $row, $item->unit_price);
            $sheet->setCellValue('F' . $row, $item->volume * $item->unit_price);
            $sheet->setCellValue('G' . $row, $item->realization);
            $row++;
        }

        foreach (range('A', 'G') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'rab-' . $project->id . '.xlsx';
        $tempPath = Storage::disk('local')->path($filename);
        $writer->save($tempPath);

        return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
    }
}
