<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sub_vendors', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('slug');
            $table->string('email')->nullable()->after('phone');
            $table->text('address')->nullable()->after('email');
            $table->string('contact_person')->nullable()->after('address');
            $table->string('npwp', 30)->nullable()->after('contact_person');
            $table->string('license_number')->nullable()->after('npwp');
        });
    }

    public function down(): void
    {
        Schema::table('sub_vendors', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
                'email',
                'address',
                'contact_person',
                'npwp',
                'license_number',
            ]);
        });
    }
};
