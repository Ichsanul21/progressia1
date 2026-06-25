<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\RabItem;
use App\Models\RabTemplate;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RabOverviewController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $search = $request->get('search');

        $query = Project::with('vendor:id,name')
            ->select('projects.*')
            ->addSelect([
                'total_budget' => RabItem::selectRaw('COALESCE(SUM(volume * unit_price), 0)')
                    ->whereColumn('project_id', 'projects.id'),
                'total_realization' => RabItem::selectRaw('COALESCE(SUM(realization), 0)')
                    ->whereColumn('project_id', 'projects.id'),
            ])
            ->withCount('rabItems');

        if (! $user->isSuperAdmin()) {
            $query->where('vendor_id', $user->vendor_id);
        } elseif ($vendorId = $request->get('vendor_id')) {
            $query->where('vendor_id', $vendorId);
        }

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $projects = $query->orderBy('name')->paginate(10)->withQueryString();

        $templates = RabTemplate::withCount('items')->orderBy('name')->get()->map(fn ($t) => [
            'id' => $t->id,
            'name' => $t->name,
            'description' => $t->description,
            'items_count' => $t->items_count,
            'download_url' => route('rab.templates.download', $t->id),
        ]);

        return Inertia::render('rab/overview', [
            'projects' => $projects,
            'templates' => $templates,
            'filters' => $request->only(['search', 'vendor_id']),
            'vendors' => $user->isSuperAdmin() ? Vendor::orderBy('name')->get(['id', 'name']) : [],
            'canDelete' => $user->isSuperAdmin(),
        ]);
    }
}
