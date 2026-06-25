<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            $table->text('description')->nullable()->after('slug');
            $table->string('contact_person')->nullable()->after('email');
            $table->string('contact_phone')->nullable()->after('phone');
            $table->string('website')->nullable()->after('contact_phone');
            $table->string('city')->nullable()->after('address');
            $table->string('province')->nullable()->after('city');
            $table->string('postal_code', 20)->nullable()->after('province');
            $table->string('npwp', 30)->nullable()->after('postal_code');
            $table->string('license_number')->nullable()->after('npwp');
            $table->year('established_year')->nullable()->after('license_number');
        });
    }

    public function down(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            $table->dropColumn([
                'description',
                'contact_person',
                'contact_phone',
                'website',
                'city',
                'province',
                'postal_code',
                'npwp',
                'license_number',
                'established_year',
            ]);
        });
    }
};
