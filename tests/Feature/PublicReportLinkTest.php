<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectReportLink;
use App\Models\User;
use App\Models\Vendor;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PublicReportLinkTest extends TestCase
{
    use RefreshDatabase;

    private function makeVendor(): Vendor
    {
        return Vendor::factory()->create();
    }

    private function makeAdmin(User $actor, Vendor $vendor): User
    {
        return User::factory()->adminVendor()->create(['vendor_id' => $vendor->id]);
    }

    public function test_admin_can_create_report_link(): void
    {
        $vendor = $this->makeVendor();
        $admin = User::factory()->superAdmin()->create();
        $project = Project::factory()->create(['vendor_id' => $vendor->id, 'target_date' => now()->addMonths(2)]);

        $this->actingAs($admin)
            ->post(route('projects.report-links.store', $project))
            ->assertRedirect();

        $this->assertDatabaseCount('project_report_links', 1);
        $link = ProjectReportLink::first();
        $this->assertEquals(48, strlen($link->token));
        $this->assertNotNull($link->password_hash);
        $this->assertTrue(Hash::check('placeholder', $link->password_hash) || strlen($link->password_hash) === 60);
    }

    public function test_pm_can_create_report_link(): void
    {
        $vendor = $this->makeVendor();
        $pm = User::factory()->projectManager()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($pm)
            ->post(route('projects.report-links.store', $project))
            ->assertRedirect();

        $this->assertDatabaseCount('project_report_links', 1);
    }

    public function test_client_cannot_create_report_link(): void
    {
        $vendor = $this->makeVendor();
        $client = User::factory()->create(['role' => 'client', 'vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($client)
            ->post(route('projects.report-links.store', $project))
            ->assertForbidden();

        $this->assertDatabaseCount('project_report_links', 0);
    }

    public function test_sub_vendor_cannot_create_report_link(): void
    {
        $vendor = $this->makeVendor();
        $sub = User::factory()->create(['role' => 'sub_vendor', 'vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($sub)
            ->post(route('projects.report-links.store', $project))
            ->assertForbidden();

        $this->assertDatabaseCount('project_report_links', 0);
    }

    public function test_link_default_expiry_uses_target_date(): void
    {
        $vendor = $this->makeVendor();
        $admin = User::factory()->superAdmin()->create();
        $target = now()->addMonths(3)->startOfDay();
        $project = Project::factory()->create([
            'vendor_id' => $vendor->id,
            'target_date' => $target,
        ]);

        $this->actingAs($admin)
            ->post(route('projects.report-links.store', $project))
            ->assertRedirect();

        $link = ProjectReportLink::first();
        $this->assertEqualsWithDelta($target->copy()->endOfDay()->timestamp, $link->expires_at->timestamp, 5);
    }

    public function test_link_fallback_expiry_one_year(): void
    {
        $vendor = $this->makeVendor();
        $admin = User::factory()->superAdmin()->create();
        $project = Project::factory()->create([
            'vendor_id' => $vendor->id,
            'start_date' => null,
            'target_date' => null,
        ]);

        $this->actingAs($admin)
            ->post(route('projects.report-links.store', $project))
            ->assertRedirect();

        $link = ProjectReportLink::first();
        $this->assertEqualsWithDelta(now()->addYear()->timestamp, $link->expires_at->timestamp, 5);
    }

    public function test_admin_can_revoke_link(): void
    {
        $vendor = $this->makeVendor();
        $admin = User::factory()->superAdmin()->create();
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $link = ProjectReportLink::create([
            'token' => 'test_token_aaaaaaaaaaaaaaaa',
            'project_id' => $project->id,
            'created_by' => $admin->id,
            'password_hash' => Hash::make('password'),
            'expires_at' => now()->addMonth(),
        ]);

        $this->actingAs($admin)
            ->delete(route('projects.report-links.destroy', [$project, $link]))
            ->assertRedirect();

        $this->assertNotNull($link->fresh()->revoked_at);
    }

    public function test_unauthenticated_user_can_view_password_form(): void
    {
        $vendor = $this->makeVendor();
        $admin = User::factory()->superAdmin()->create();
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $link = ProjectReportLink::create([
            'token' => 'visible_token_aaaaaaaaaaaaaaaaaa',
            'project_id' => $project->id,
            'created_by' => $admin->id,
            'password_hash' => Hash::make('secret123'),
            'expires_at' => now()->addMonth(),
        ]);

        $this->get('/r/'.$link->token)
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('public/password'));
    }

    public function test_correct_password_unlocks_report(): void
    {
        $vendor = $this->makeVendor();
        $admin = User::factory()->superAdmin()->create();
        $project = Project::factory()->create(['vendor_id' => $vendor->id, 'name' => 'Test Project']);
        $link = ProjectReportLink::create([
            'token' => 'unlock_token_aaaaaaaaaaaaaaaaaa',
            'project_id' => $project->id,
            'created_by' => $admin->id,
            'password_hash' => Hash::make('secret123'),
            'expires_at' => now()->addMonth(),
        ]);

        $this->post('/r/'.$link->token, ['password' => 'secret123'])
            ->assertRedirect('/r/'.$link->token);

        $this->get('/r/'.$link->token)
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('public/report')
                ->where('project.name', 'Test Project'));
    }

    public function test_wrong_password_returns_error(): void
    {
        $vendor = $this->makeVendor();
        $admin = User::factory()->superAdmin()->create();
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $link = ProjectReportLink::create([
            'token' => 'wrong_token_aaaaaaaaaaaaaaaaaaaa',
            'project_id' => $project->id,
            'created_by' => $admin->id,
            'password_hash' => Hash::make('secret123'),
            'expires_at' => now()->addMonth(),
        ]);

        $this->post('/r/'.$link->token, ['password' => 'WRONG'])
            ->assertRedirect()
            ->assertSessionHasErrors('password');
    }

    public function test_revoked_link_returns_410(): void
    {
        $vendor = $this->makeVendor();
        $admin = User::factory()->superAdmin()->create();
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $link = ProjectReportLink::create([
            'token' => 'revoked_token_aaaaaaaaaaaaaaaaaa',
            'project_id' => $project->id,
            'created_by' => $admin->id,
            'password_hash' => Hash::make('secret123'),
            'expires_at' => now()->addMonth(),
            'revoked_at' => now(),
        ]);

        $this->get('/r/'.$link->token)
            ->assertStatus(410);
    }

    public function test_expired_link_returns_410(): void
    {
        $vendor = $this->makeVendor();
        $admin = User::factory()->superAdmin()->create();
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $link = ProjectReportLink::create([
            'token' => 'expired_token_aaaaaaaaaaaaaaaaaa',
            'project_id' => $project->id,
            'created_by' => $admin->id,
            'password_hash' => Hash::make('secret123'),
            'expires_at' => Carbon::now()->subDay(),
        ]);

        $this->get('/r/'.$link->token)
            ->assertStatus(410);
    }

    public function test_pdf_download_after_unlock(): void
    {
        $vendor = $this->makeVendor();
        $admin = User::factory()->superAdmin()->create();
        $project = Project::factory()->create(['vendor_id' => $vendor->id, 'name' => 'PDF Test']);
        $link = ProjectReportLink::create([
            'token' => 'pdf_token_aaaaaaaaaaaaaaaaaaaaaaaa',
            'project_id' => $project->id,
            'created_by' => $admin->id,
            'password_hash' => Hash::make('secret123'),
            'expires_at' => now()->addMonth(),
        ]);

        $this->post('/r/'.$link->token, ['password' => 'secret123'])->assertRedirect();

        $response = $this->get('/r/'.$link->token.'/pdf');
        $response->assertOk();
        $this->assertEquals('application/pdf', $response->headers->get('Content-Type'));
    }

    public function test_access_count_increments(): void
    {
        $vendor = $this->makeVendor();
        $admin = User::factory()->superAdmin()->create();
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $link = ProjectReportLink::create([
            'token' => 'count_token_aaaaaaaaaaaaaaaaaaaaaa',
            'project_id' => $project->id,
            'created_by' => $admin->id,
            'password_hash' => Hash::make('secret123'),
            'expires_at' => now()->addMonth(),
        ]);

        $this->post('/r/'.$link->token, ['password' => 'secret123']);
        $this->get('/r/'.$link->token);
        $this->get('/r/'.$link->token);

        $this->assertEquals(2, $link->fresh()->access_count);
    }

    public function test_hard_delete_project_cascades_links(): void
    {
        $vendor = $this->makeVendor();
        $admin = User::factory()->superAdmin()->create();
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $link = ProjectReportLink::create([
            'token' => 'cascade_token_aaaaaaaaaaaaaaaaaaaa',
            'project_id' => $project->id,
            'created_by' => $admin->id,
            'password_hash' => Hash::make('secret123'),
            'expires_at' => now()->addMonth(),
        ]);

        $project->forceDelete();

        $this->assertDatabaseMissing('project_report_links', ['id' => $link->id]);
    }

    public function test_admin_can_reveal_link_password(): void
    {
        $vendor = $this->makeVendor();
        $admin = User::factory()->superAdmin()->create();
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        [$link] = ProjectReportLink::generateFor($project, $admin);

        $response = $this->actingAs($admin)
            ->getJson(route('projects.report-links.reveal', [$project, $link]));

        $response->assertOk();
        $response->assertJsonStructure(['password']);
        $this->assertEquals($link->plain_password, $response->json('password'));
    }

    public function test_pm_can_reveal_link_password(): void
    {
        $vendor = $this->makeVendor();
        $pm = User::factory()->projectManager()->create(['vendor_id' => $vendor->id]);
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        [$link] = ProjectReportLink::generateFor($project, $pm);

        $this->actingAs($pm)
            ->getJson(route('projects.report-links.reveal', [$project, $link]))
            ->assertOk();
    }

    public function test_client_cannot_reveal_link_password(): void
    {
        $vendor = $this->makeVendor();
        $client = User::factory()->create(['role' => 'client', 'vendor_id' => $vendor->id]);
        $admin = User::factory()->superAdmin()->create();
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        [$link] = ProjectReportLink::generateFor($project, $admin);

        $this->actingAs($client)
            ->getJson(route('projects.report-links.reveal', [$project, $link]))
            ->assertForbidden();
    }

    public function test_reveal_increments_count_and_updates_timestamp(): void
    {
        $vendor = $this->makeVendor();
        $admin = User::factory()->superAdmin()->create();
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        [$link] = ProjectReportLink::generateFor($project, $admin);
        $this->assertEquals(0, $link->reveal_count);
        $this->assertNull($link->last_revealed_at);

        $this->actingAs($admin)
            ->getJson(route('projects.report-links.reveal', [$project, $link]))
            ->assertOk();

        $link->refresh();
        $this->assertEquals(1, $link->reveal_count);
        $this->assertNotNull($link->last_revealed_at);
    }

    public function test_existing_link_without_encrypted_password_returns_404(): void
    {
        $vendor = $this->makeVendor();
        $admin = User::factory()->superAdmin()->create();
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        $link = ProjectReportLink::create([
            'token' => 'no_plain_token_aaaaaaaaaaaaaaaaaa',
            'project_id' => $project->id,
            'created_by' => $admin->id,
            'password_hash' => Hash::make('secret123'),
            'password_encrypted' => null,
            'expires_at' => now()->addMonth(),
        ]);

        $this->actingAs($admin)
            ->getJson(route('projects.report-links.reveal', [$project, $link]))
            ->assertNotFound();
    }

    public function test_admin_can_reset_link_password(): void
    {
        $vendor = $this->makeVendor();
        $admin = User::factory()->superAdmin()->create();
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        [$link, $oldPassword] = ProjectReportLink::generateFor($project, $admin);
        $oldHash = $link->password_hash;

        $this->actingAs($admin)
            ->post(route('projects.report-links.reset-password', [$project, $link]))
            ->assertRedirect();

        $link->refresh();
        $this->assertNotEquals($oldHash, $link->password_hash);
        $this->assertNotEquals($oldPassword, $link->plain_password);
        $this->assertNotNull($link->plain_password);
    }

    public function test_reset_password_invalidates_old_password(): void
    {
        $vendor = $this->makeVendor();
        $admin = User::factory()->superAdmin()->create();
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        [$link, $oldPassword] = ProjectReportLink::generateFor($project, $admin);

        $this->actingAs($admin)
            ->post(route('projects.report-links.reset-password', [$project, $link]))
            ->assertRedirect();

        $link->refresh();
        $newPassword = $link->plain_password;

        $this->post('/r/'.$link->token, ['password' => $oldPassword])
            ->assertSessionHasErrors('password');

        $this->post('/r/'.$link->token, ['password' => $newPassword])
            ->assertRedirect('/r/'.$link->token);
    }

    public function test_cannot_reset_revoked_link(): void
    {
        $vendor = $this->makeVendor();
        $admin = User::factory()->superAdmin()->create();
        $project = Project::factory()->create(['vendor_id' => $vendor->id]);
        [$link] = ProjectReportLink::generateFor($project, $admin);
        $link->revoke();

        $this->actingAs($admin)
            ->post(route('projects.report-links.reset-password', [$project, $link]))
            ->assertStatus(410);
    }
}
