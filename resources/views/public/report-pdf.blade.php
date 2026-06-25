<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Laporan {{ $project['name'] }}</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; color: #1a1a1a; font-size: 11px; line-height: 1.5; }
        .header { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #e5e5e5; padding-bottom: 12px; margin-bottom: 16px; }
        .header img.logo { max-height: 48px; max-width: 120px; object-fit: contain; }
        .header .vendor-name { font-size: 18px; font-weight: bold; }
        .header .subtitle { font-size: 9px; color: #666; }
        h1 { font-size: 16px; margin: 14px 0 6px; }
        h2 { font-size: 13px; margin: 12px 0 6px; border-bottom: 1px solid #e5e5e5; padding-bottom: 4px; }
        h3 { font-size: 11px; margin: 8px 0 4px; color: #475569; }
        .meta { font-size: 10px; color: #666; margin: 0 0 12px; }
        .progress-bar { background: #e5e5e5; height: 8px; border-radius: 4px; overflow: hidden; }
        .progress-fill { background: #3b82f6; height: 100%; }
        .status-badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: bold; }
        .status-not_started { background: #f1f5f9; color: #475569; }
        .status-in_progress { background: #dbeafe; color: #1e40af; }
        .status-review { background: #fef3c7; color: #92400e; }
        .status-done { background: #dcfce7; color: #166534; }
        .status-revisi { background: #fee2e2; color: #991b1b; }
        .task { display: flex; align-items: flex-start; gap: 6px; padding: 4px 0; border-bottom: 1px solid #f1f5f9; }
        .task .name { flex: 1; }
        .task .meta { margin: 2px 0 0 0; font-size: 9px; color: #666; }
        .rab-grid { display: flex; gap: 12px; margin: 8px 0; }
        .rab-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 10px; }
        .rab-card .label { font-size: 9px; color: #64748b; text-transform: uppercase; }
        .rab-card .value { font-size: 16px; font-weight: bold; margin-top: 4px; }
        .footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #e5e5e5; font-size: 9px; color: #666; display: flex; justify-content: space-between; }
        .cover-image { max-height: 180px; max-width: 100%; object-fit: cover; margin-bottom: 12px; border-radius: 4px; }
        .summary-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        .summary-table td { padding: 4px 8px; border-bottom: 1px solid #f1f5f9; font-size: 10px; }
        .summary-table td:first-child { color: #64748b; width: 35%; }
    </style>
</head>
<body>
    <div class="header">
        @if(! empty($vendor['logo_url']))
            <img class="logo" src="{{ $vendor['logo_url'] }}" alt="{{ $vendor['name'] }}">
        @endif
        <div>
            <div class="vendor-name">{{ $vendor['name'] ?? '—' }}</div>
            <div class="subtitle">Laporan Progress • Progressia</div>
        </div>
    </div>

    @if(! empty($project['cover_image_url']))
        <img class="cover-image" src="{{ $project['cover_image_url'] }}" alt="">
    @endif

    <h1>{{ $project['name'] }}</h1>
    <p class="meta">
        @if($project['start_date'] || $project['target_date'])
            @if($project['start_date']){{ \Carbon\Carbon::parse($project['start_date'])->translatedFormat('d M Y') }}@endif
            @if($project['start_date'] && $project['target_date']) → @endif
            @if($project['target_date']){{ \Carbon\Carbon::parse($project['target_date'])->translatedFormat('d M Y') }}@endif
        @endif
    </p>

    <h2>Progress Keseluruhan: {{ $project['progress'] }}%</h2>
    <div class="progress-bar">
        <div class="progress-fill" style="width: {{ $project['progress'] }}%"></div>
    </div>

    <h2>Ringkasan RAB</h2>
    <div class="rab-grid">
        <div class="rab-card">
            <div class="label">Total Item</div>
            <div class="value">{{ $rab_summary['items'] }}</div>
        </div>
        <div class="rab-card">
            <div class="label">Total Anggaran</div>
            <div class="value">Rp {{ number_format($rab_summary['total'], 0, ',', '.') }}</div>
        </div>
    </div>

    <h2>Phase &amp; Task</h2>
    @forelse($phases as $phase)
        <h3>
            {{ $phase['name'] }}
            <span style="float:right;">{{ $phase['progress'] }}%</span>
        </h3>
        <div class="progress-bar" style="margin-bottom:6px;">
            <div class="progress-fill" style="width: {{ $phase['progress'] }}%"></div>
        </div>
        @forelse($phase['tasks'] as $task)
            <div class="task">
                <span class="status-badge status-{{ $task['status'] }}">{{ str_replace('_', ' ', strtoupper($task['status'])) }}</span>
                <div style="flex:1;">
                    <div class="name">{{ $task['name'] }}</div>
                    <div class="meta">Progress: {{ $task['progress'] }}%</div>
                </div>
            </div>
        @empty
            <p class="meta">Tidak ada task di phase ini.</p>
        @endforelse
    @empty
        <p class="meta">Belum ada phase.</p>
    @endforelse

    <div class="footer">
        <span>{{ $vendor['name'] ?? '' }}</span>
        <span>Generated by Progressia &middot; {{ \Carbon\Carbon::parse($generated_at)->translatedFormat('d M Y H:i') }} &middot; {{ $access_count }}x diakses</span>
    </div>
</body>
</html>
