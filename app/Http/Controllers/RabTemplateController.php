<?php

namespace App\Http\Controllers;

use App\Models\RabTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class RabTemplateController extends Controller
{
    public function download(RabTemplate $rabTemplate)
    {
        $items = $rabTemplate->items()->orderBy('sort_order')->get();

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle($rabTemplate->name);

        $headers = ['code', 'name', 'unit', 'volume', 'unit_price'];
        $sheet->fromArray([$headers], null, 'A1');

        $row = 2;
        foreach ($items as $item) {
            $sheet->setCellValue('A' . $row, $item->code);
            $sheet->setCellValue('B' . $row, $item->name);
            $sheet->setCellValue('C' . $row, $item->unit);
            $sheet->setCellValue('D' . $row, $item->volume);
            $sheet->setCellValue('E' . $row, $item->unit_price);
            $row++;
        }

        foreach (range('A', 'E') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'rab-template-' . \Illuminate\Support\Str::slug($rabTemplate->name) . '.xlsx';
        $tempPath = Storage::disk('local')->path($filename);
        $writer->save($tempPath);

        return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
    }

    public function destroy(RabTemplate $rabTemplate): RedirectResponse
    {
        $rabTemplate->delete();

        return back()->with('success', __('RAB template deleted.'));
    }
}
