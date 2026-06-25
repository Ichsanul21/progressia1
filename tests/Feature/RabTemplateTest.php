<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\RabItem;
use App\Models\RabTemplate;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RabTemplateTest extends TestCase
{
    use RefreshDatabase;

    private function adminVendor(Vendor $vendor = null): array
    {
        $vendor ??= Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        return [$user, $vendor];
    }

    public function test_guest_cannot_access_rab_overview()
    {
        $this->get('/rab')->assertRedirect('/login');
    }

    public function test_non_admin_cannot_access_rab_overview()
    {
        $user = User::factory()->create(['role' => 'team']);
        $this->actingAs($user);
        $this->get('/rab')->assertForbidden();
    }

    public function test_admin_vendor_can_view_rab_overview()
    {
        [$user] = $this->adminVendor();
        $this->actingAs($user);
        $this->get('/rab')->assertOk();
    }

    public function test_overview_shows_projects_and_templates()
    {
        [$user, $vendor] = $this->adminVendor();
        $project = Project::factory()->create(['vendor_id' => $vendor->id, 'name' => 'Test Project']);
        RabItem::create([
            'project_id' => $project->id,
            'vendor_id' => $vendor->id,
            'name' => 'Item A',
            'unit' => 'm',
            'volume' => 10,
            'unit_price' => 100,
            'realization' => 500,
            'sort_order' => 0,
        ]);
        $template = RabTemplate::create(['name' => 'System Template']);
        $template->items()->create(['name' => 'Tpl Item', 'unit' => 'pcs', 'volume' => 0, 'unit_price' => 0, 'sort_order' => 0]);

        $this->actingAs($user);
        $this->get('/rab')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('rab/overview')
                ->where('projects.total', 1)
                ->where('projects.data.0.name', 'Test Project')
                ->where('projects.data.0.total_budget', 1000)
                ->where('projects.data.0.total_realization', 500)
                ->where('templates.0.name', 'System Template')
            );
    }

    public function test_admin_vendor_only_sees_own_vendor_projects()
    {
        $vendorA = Vendor::factory()->create();
        $vendorB = Vendor::factory()->create();
        $userA = User::factory()->adminVendor()->create(['vendor_id' => $vendorA->id]);
        Project::factory()->create(['vendor_id' => $vendorA->id, 'name' => 'A Project']);
        Project::factory()->create(['vendor_id' => $vendorB->id, 'name' => 'B Project']);

        $this->actingAs($userA);
        $this->get('/rab')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('projects.total', 1)
                ->where('projects.data.0.name', 'A Project')
            );
    }

    public function test_super_admin_can_filter_overview_by_vendor()
    {
        $vendorA = Vendor::factory()->create(['name' => 'Vendor A']);
        $vendorB = Vendor::factory()->create(['name' => 'Vendor B']);
        $superAdmin = User::factory()->superAdmin()->create();
        Project::factory()->create(['vendor_id' => $vendorA->id, 'name' => 'A Project']);
        Project::factory()->create(['vendor_id' => $vendorB->id, 'name' => 'B Project']);

        $this->actingAs($superAdmin);
        $this->get("/rab?vendor_id={$vendorA->id}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('projects.total', 1)
                ->where('projects.data.0.name', 'A Project')
            );
    }

    public function test_admin_vendor_can_download_template()
    {
        Storage::fake('local');
        [$user] = $this->adminVendor();
        $template = RabTemplate::create(['name' => 'My Template']);
        $template->items()->create(['name' => 'Item 1', 'unit' => 'pcs', 'volume' => 0, 'unit_price' => 0, 'sort_order' => 0]);

        $this->actingAs($user);
        $this->get("/rab/templates/{$template->id}/download")->assertOk();
    }

    public function test_guest_cannot_download_template()
    {
        $template = RabTemplate::create(['name' => 'Tpl']);
        $this->get("/rab/templates/{$template->id}/download")->assertRedirect('/login');
    }

    public function test_non_admin_cannot_download_template()
    {
        $user = User::factory()->create(['role' => 'team']);
        $template = RabTemplate::create(['name' => 'Tpl']);
        $this->actingAs($user);
        $this->get("/rab/templates/{$template->id}/download")->assertForbidden();
    }

    public function test_admin_vendor_can_delete_template()
    {
        [$user] = $this->adminVendor();
        $template = RabTemplate::create(['name' => 'Delete Me']);
        $template->items()->create(['name' => 'Item', 'unit' => 'pcs', 'volume' => 0, 'unit_price' => 0, 'sort_order' => 0]);

        $this->actingAs($user);
        $this->delete("/rab/templates/{$template->id}")->assertRedirect();

        $this->assertDatabaseMissing('rab_templates', ['id' => $template->id]);
        $this->assertDatabaseMissing('rab_template_items', ['rab_template_id' => $template->id]);
    }

    public function test_search_filters_projects()
    {
        $vendor = Vendor::factory()->create();
        $user = User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
        Project::factory()->create(['vendor_id' => $vendor->id, 'name' => 'Gedung Serbaguna']);
        Project::factory()->create(['vendor_id' => $vendor->id, 'name' => 'Jembatan Sukamaju']);

        $this->actingAs($user);
        $this->get('/rab?search=gedung')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('projects.total', 1)
                ->where('projects.data.0.name', 'Gedung Serbaguna')
            );
    }
}
