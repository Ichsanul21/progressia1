<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PhoneValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_phone_must_start_with_plus_62_and_8()
    {
        $admin = User::factory()->superAdmin()->create();
        $vendor = Vendor::factory()->create();

        $this->actingAs($admin);

        $invalidCases = ['08123456789', '+6298123456789', '+62812345', '8123456789', '+62812345678901234'];

        foreach ($invalidCases as $phone) {
            $this->post('/admin/users', [
                'name' => 'Test',
                'email' => 'test'.uniqid().'@test.com',
                'phone' => $phone,
                'role' => 'team',
                'vendor_id' => $vendor->id,
            ])->assertSessionHasErrors(['phone']);
        }
    }

    public function test_phone_accepts_valid_indonesian_mobile_format()
    {
        $admin = User::factory()->superAdmin()->create();
        $vendor = Vendor::factory()->create();

        $this->actingAs($admin);

        $validCases = ['+628123456789', '+6281234567890', '+62812345678', '+62881234567890'];

        foreach ($validCases as $i => $phone) {
            $response = $this->post('/admin/users', [
                'name' => "Test {$i}",
                'email' => "test{$i}_".uniqid().'@test.com',
                'phone' => $phone,
                'role' => 'team',
                'vendor_id' => $vendor->id,
            ]);
            $response->assertSessionHasNoErrors();
        }
    }
}
