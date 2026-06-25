<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Project Report</title>
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 10pt; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background-color: #f4f4f4; font-weight: bold; }
        h1 { font-size: 16pt; margin-bottom: 5px; }
        .meta { color: #666; font-size: 9pt; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>Project Report</h1>
    <div class="meta">Generated: {{ now()->format('Y-m-d H:i') }}</div>
    <table>
        <thead>
            <tr>
                <th>Project</th>
                <th>Vendor</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Tasks</th>
                <th>Phases</th>
                <th>Start Date</th>
                <th>End Date</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($projects as $project)
            <tr>
                <td>{{ $project->name }}</td>
                <td>{{ $project->vendor?->name ?? '—' }}</td>
                <td>{{ $project->status }}</td>
                <td>{{ $project->progress }}%</td>
                <td>{{ $project->tasks_count }}</td>
                <td>{{ $project->phases_count }}</td>
                <td>{{ $project->start_date?->format('Y-m-d') ?? '' }}</td>
                <td>{{ $project->end_date?->format('Y-m-d') ?? '' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
