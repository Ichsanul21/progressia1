<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Csv;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ReportsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        abort_if($request->user()->isClient(), 403);

        $user = $request->user();

        $projects = Project::with('vendor:id,name')
            ->withCount('tasks', 'phases')
            ->active()
            ->get();

        $totalProjects = $projects->count();
        $statusBreakdown = $projects->groupBy('status')->map->count();
        $completedProjects = $projects->where('status', 'done')->count();
        $inProgressProjects = $projects->where('status', 'in_progress')->count();

        $projectQuery = Project::active();
        if (! $user->isSuperAdmin()) {
            $projectQuery->where('vendor_id', $user->vendor_id);
        }

        $totalTasks = Task::whereIn('project_id', $projectQuery->pluck('id'))->count();
        $completedTasks = Task::whereIn('project_id', $projectQuery->pluck('id'))
            ->where('status', 'done')
            ->count();

        $averageProgress = $projects->avg('progress');

        $recentActivity = Project::active()
            ->latest('updated_at')
            ->take(10)
            ->get(['id', 'name', 'status', 'progress', 'updated_at']);

        return Inertia::render('reports/index', [
            'stats' => [
                'totalProjects' => $totalProjects,
                'completedProjects' => $completedProjects,
                'inProgressProjects' => $inProgressProjects,
                'totalTasks' => $totalTasks,
                'completedTasks' => $completedTasks,
                'averageProgress' => round($averageProgress ?? 0),
            ],
            'statusBreakdown' => $statusBreakdown,
            'recentActivity' => $recentActivity,
        ]);
    }

    public function export(Request $request)
    {
        abort_if($request->user()->isClient(), 403);

        return match ($request->format) {
            'xlsx' => $this->exportXlsx($request),
            'csv' => $this->exportCsv($request),
            'pdf' => $this->exportPdf($request),
            default => abort(400, 'Invalid format'),
        };
    }

    protected function getReportData(Request $request)
    {
        $user = $request->user();
        $projectQuery = Project::with('vendor:id,name')->active();

        if (! $user->isSuperAdmin()) {
            $projectQuery->where('vendor_id', $user->vendor_id);
        }

        return $projectQuery->get();
    }

    protected function buildSpreadsheet($projects)
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();

        $sheet->setCellValue('A1', 'Project Name');
        $sheet->setCellValue('B1', 'Vendor');
        $sheet->setCellValue('C1', 'Status');
        $sheet->setCellValue('D1', 'Progress (%)');
        $sheet->setCellValue('E1', 'Tasks');
        $sheet->setCellValue('F1', 'Phases');
        $sheet->setCellValue('G1', 'Start Date');
        $sheet->setCellValue('H1', 'End Date');

        $row = 2;
        foreach ($projects as $project) {
            $sheet->setCellValue("A{$row}", $project->name);
            $sheet->setCellValue("B{$row}", $project->vendor?->name ?? '—');
            $sheet->setCellValue("C{$row}", $project->status);
            $sheet->setCellValue("D{$row}", $project->progress);
            $sheet->setCellValue("E{$row}", $project->tasks_count);
            $sheet->setCellValue("F{$row}", $project->phases_count);
            $sheet->setCellValue("G{$row}", $project->start_date?->format('Y-m-d') ?? '');
            $sheet->setCellValue("H{$row}", $project->end_date?->format('Y-m-d') ?? '');
            $row++;
        }

        return $spreadsheet;
    }

    protected function exportXlsx(Request $request)
    {
        $projects = $this->getReportData($request);
        $spreadsheet = $this->buildSpreadsheet($projects);

        $writer = new Xlsx($spreadsheet);
        $filename = 'report-'.now()->format('Y-m-d-His').'.xlsx';

        return response()->stream(
            function () use ($writer) {
                $writer->save('php://output');
            },
            200,
            [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ]
        );
    }

    protected function exportCsv(Request $request)
    {
        $projects = $this->getReportData($request);
        $spreadsheet = $this->buildSpreadsheet($projects);

        $writer = new Csv($spreadsheet);
        $filename = 'report-'.now()->format('Y-m-d-His').'.csv';

        return response()->stream(
            function () use ($writer) {
                $writer->save('php://output');
            },
            200,
            [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ]
        );
    }

    protected function exportPdf(Request $request)
    {
        $projects = $this->getReportData($request);

        $html = view('reports.pdf', ['projects' => $projects])->render();

        $options = new Options;
        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('isRemoteEnabled', true);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        $filename = 'report-'.now()->format('Y-m-d-His').'.pdf';

        return response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
