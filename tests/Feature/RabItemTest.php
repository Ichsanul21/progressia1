<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RabItemTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_rab()
    {
        $project = Project::factory()->create();
        $this->get("/projects/{$project->id}/rab")->assertRedirect('/login');
    }

    public function test_user_can_view_rab()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user);
        $this->get("/projects/{$project->id}/rab")->assertOk();
    }

    public function test_user_can_create_rab_item()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $phase = $project->phases()->create(['name' => 'Phase 1', 'sort_order' => 0]);

        $this->actingAs($user);
        $this->post("/projects/{$project->id}/rab", [
            'name' => 'Excavation',
            'unit' => 'm3',
            'volume' => 100,
            'unit_price' => 50000,
            'phase_id' => $phase->id,
        ])->assertRedirect();

        $this->assertDatabaseHas('rab_items', [
            'project_id' => $project->id,
            'name' => 'Excavation',
            'vendor_id' => $vendor->id,
        ]);
    }

    public function test_user_can_update_rab_item()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $item = $project->rabItems()->create([
            'name' => 'Old Name',
            'unit' => 'm3',
            'volume' => 50,
            'unit_price' => 10000,
            'vendor_id' => $vendor->id,
            'sort_order' => 0,
        ]);

        $this->actingAs($user);
        $this->put("/projects/{$project->id}/rab/{$item->id}", [
            'name' => 'Updated Name',
            'unit' => 'm3',
            'volume' => 75,
            'unit_price' => 15000,
        ])->assertRedirect();

        $this->assertDatabaseHas('rab_items', [
            'id' => $item->id,
            'name' => 'Updated Name',
            'volume' => 75.00,
            'unit_price' => 15000.00,
        ]);
    }

    public function test_user_can_delete_rab_item()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $item = $project->rabItems()->create([
            'name' => 'Delete Me',
            'unit' => 'm3',
            'volume' => 10,
            'unit_price' => 1000,
            'vendor_id' => $vendor->id,
            'sort_order' => 0,
        ]);

        $this->actingAs($user);
        $this->delete("/projects/{$project->id}/rab/{$item->id}")->assertRedirect();

        $this->assertDatabaseMissing('rab_items', ['id' => $item->id]);
    }

    public function test_user_can_export_rab()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $project->rabItems()->create([
            'name' => 'Export Item',
            'unit' => 'm3',
            'volume' => 10,
            'unit_price' => 50000,
            'vendor_id' => $vendor->id,
            'sort_order' => 0,
        ]);

        $this->actingAs($user);
        $this->get("/projects/{$project->id}/rab/export")->assertOk();
    }

    public function test_user_can_download_export_template()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user);
        $this->get("/projects/{$project->id}/rab/export-template")->assertOk();
    }

    public function test_user_can_import_rab_items()
    {
        Storage::fake('local');

        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $content = "code,name,unit,volume,unit_price\n1.1,Excavation,m3,100,50000\n1.2,Concrete,m3,50,75000\n";
        $file = UploadedFile::fake()->createWithContent('rab.csv', $content);

        $this->actingAs($user);
        $this->post("/projects/{$project->id}/rab/import", [
            'file' => $file,
        ])->assertRedirect();

        $this->assertDatabaseHas('rab_items', [
            'project_id' => $project->id,
            'name' => 'Excavation',
            'volume' => 100.00,
        ]);

        $this->assertDatabaseHas('rab_items', [
            'project_id' => $project->id,
            'name' => 'Concrete',
            'volume' => 50.00,
        ]);
    }

    public function test_import_requires_valid_columns()
    {
        Storage::fake('local');

        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $content = "wrong,col,umns\n1,2,3\n";
        $file = UploadedFile::fake()->createWithContent('bad.csv', $content);

        $this->actingAs($user);
        $this->post("/projects/{$project->id}/rab/import", [
            'file' => $file,
        ])->assertRedirect();

        $this->assertDatabaseCount('rab_items', 0);
    }

    public function test_store_redirects_to_rab_index(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user)
            ->post("/projects/{$project->id}/rab", [
                'name' => 'Redirect Test Item',
                'unit' => 'm3',
                'volume' => 1,
                'unit_price' => 1,
            ])
            ->assertRedirectContains('/projects/'.$project->id.'/rab');
    }

    public function test_destroy_redirects_to_rab_index(): void
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $item = $project->rabItems()->create([
            'name' => 'Item To Delete',
            'unit' => 'm3',
            'volume' => 1,
            'unit_price' => 1,
            'vendor_id' => $vendor->id,
            'sort_order' => 0,
        ]);

        $this->actingAs($user)
            ->delete("/projects/{$project->id}/rab/{$item->id}")
            ->assertRedirectContains('/projects/'.$project->id.'/rab');
    }
}
