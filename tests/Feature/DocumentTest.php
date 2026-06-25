<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\Project;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_upload_document()
    {
        $project = Project::factory()->create();
        $file = UploadedFile::fake()->create('doc.pdf', 100);

        $this->post("/projects/{$project->id}/documents", [
            'name' => 'Test Doc',
            'file' => $file,
        ])->assertRedirect('/login');
    }

    public function test_user_can_upload_document()
    {
        Storage::fake('public');
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user);

        $file = UploadedFile::fake()->create('contract.pdf', 500);
        $this->post("/projects/{$project->id}/documents", [
            'name' => 'Contract',
            'category' => 'contract',
            'file' => $file,
        ])->assertRedirect();

        $this->assertDatabaseHas('documents', [
            'project_id' => $project->id,
            'name' => 'Contract',
            'category' => 'contract',
        ]);
    }

    public function test_user_can_download_document()
    {
        Storage::fake('public');
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $file = UploadedFile::fake()->create('report.pdf', 200);
        $path = $file->store('documents/' . $project->id, 'public');

        $document = Document::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'file_path' => $path,
            'uploaded_by' => $user->id,
        ]);

        $this->actingAs($user);
        $response = $this->get("/projects/{$project->id}/documents/{$document->id}/download");

        $response->assertOk();
    }

    public function test_user_can_delete_document()
    {
        Storage::fake('public');
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $file = UploadedFile::fake()->create('delete.pdf', 100);
        $path = $file->store('documents/' . $project->id, 'public');

        $document = Document::factory()->create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'file_path' => $path,
            'uploaded_by' => $user->id,
        ]);

        $this->actingAs($user);
        $this->delete("/projects/{$project->id}/documents/{$document->id}")->assertRedirect();

        $this->assertSoftDeleted($document);
        Storage::disk('public')->assertMissing($path);
    }
}
