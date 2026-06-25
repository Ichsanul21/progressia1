<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LandingPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_root_renders_landing_component(): void
    {
        $response = $this->get('/');

        $response->assertOk()->assertInertia(fn ($page) => $page->component('landing'));
    }

    public function test_root_is_named_home(): void
    {
        $this->assertSame(url('/'), route('home'));
    }

    public function test_register_route_shows_registrant_form(): void
    {
        $response = $this->get('/register');

        $response->assertOk()->assertInertia(fn ($page) => $page
            ->component('auth/register')
            ->has('industries')
            ->has('teamSizes')
            ->has('sources')
        );
    }
}
