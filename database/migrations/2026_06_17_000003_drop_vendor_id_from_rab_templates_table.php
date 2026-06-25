<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rab_templates', function (Blueprint $table) {
            $table->dropConstrainedForeignId('vendor_id');
        });
    }

    public function down(): void
    {
        Schema::table('rab_templates', function (Blueprint $table) {
            $table->foreignId('vendor_id')->nullable()->constrained()->nullOnDelete();
        });
    }
};
