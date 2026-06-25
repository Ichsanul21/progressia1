<?php

namespace Tests\Feature;

use App\Events\RegistrantSubmitted;
use App\Models\Registrant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class RegistrantSubmissionTest extends TestCase
{
    use RefreshDatabase;

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Budi Santoso',
            'email' => 'budi@kontraktor.test',
            'phone' => '+628123456789',
            'company_name' => 'PT Konstruksi Nusantara',
            'industry' => 'konstruksi',
            'team_size' => '21-50',
            'source' => 'google',
            'message' => 'Butuh aplikasi untuk 3 project aktif.',
            'website' => '',
        ], $overrides);
    }

    public function test_valid_submission_creates_pending_row(): void
    {
        Event::fake([RegistrantSubmitted::class]);

        $response = $this->post('/register', $this->validPayload());

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('registrants', [
            'email' => 'budi@kontraktor.test',
            'status' => 'pending',
        ]);
        Event::assertDispatched(RegistrantSubmitted::class);
    }

    public function test_duplicate_email_in_users_rejected(): void
    {
        User::factory()->create(['email' => 'taken@vendor.test']);

        $response = $this->from('/register')->post('/register', $this->validPayload(['email' => 'taken@vendor.test']));

        $response->assertSessionHasErrors('email');
        $this->assertDatabaseCount('registrants', 0);
    }

    public function test_duplicate_pending_email_rejected(): void
    {
        Event::fake([RegistrantSubmitted::class]);

        Registrant::create([
            'name' => 'Old',
            'email' => 'pending@vendor.test',
            'phone' => '+628123456789',
            'company_name' => 'Old Co',
            'industry' => 'konstruksi',
            'team_size' => '1-5',
            'source' => 'google',
            'status' => 'pending',
        ]);

        $response = $this->from('/register')->post('/register', $this->validPayload(['email' => 'pending@vendor.test']));

        $response->assertSessionHasErrors('email');
        $this->assertDatabaseCount('registrants', 1);
    }

    public function test_rejected_status_email_can_resubmit(): void
    {
        Event::fake([RegistrantSubmitted::class]);

        Registrant::create([
            'name' => 'Old',
            'email' => 'rejected@vendor.test',
            'phone' => '+628123456789',
            'company_name' => 'Old Co',
            'industry' => 'konstruksi',
            'team_size' => '1-5',
            'source' => 'google',
            'status' => 'rejected',
        ]);

        $response = $this->post('/register', $this->validPayload(['email' => 'rejected@vendor.test']));

        $response->assertSessionHas('success');
        $registrant = Registrant::where('email', 'rejected@vendor.test')->first();
        $this->assertEquals('pending', $registrant->status);
    }

    public function test_invalid_phone_format_rejected(): void
    {
        $response = $this->from('/register')->post('/register', $this->validPayload(['phone' => '08123456789']));

        $response->assertSessionHasErrors('phone');
    }

    public function test_honeypot_filled_silent_reject(): void
    {
        Event::fake([RegistrantSubmitted::class]);

        $response = $this->post('/register', $this->validPayload(['website' => 'http://spam.test']));

        $response->assertSessionHas('success');
        $this->assertDatabaseCount('registrants', 0);
        Event::assertNotDispatched(RegistrantSubmitted::class);
    }

    public function test_invalid_industry_rejected(): void
    {
        $response = $this->from('/register')->post('/register', $this->validPayload(['industry' => 'invalid']));

        $response->assertSessionHasErrors('industry');
    }

    public function test_industries_teamsizes_sources_enums_exposed(): void
    {
        $response = $this->get('/register');

        $response->assertInertia(fn ($page) => $page
            ->component('auth/register')
            ->has('industries')
            ->has('teamSizes')
            ->has('sources')
        );
    }

    public function test_soft_deleted_user_email_blocked_for_registrant(): void
    {
        $existing = User::factory()->create(['email' => 'deactivated@test.com']);
        $existing->delete();

        $this->assertSoftDeleted('users', ['id' => $existing->id]);

        $response = $this->from('/register')->post('/register', $this->validPayload(['email' => 'deactivated@test.com']));

        $response->assertSessionHasErrors('email');
        $this->assertDatabaseCount('registrants', 0);
    }
}
