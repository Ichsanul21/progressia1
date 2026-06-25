<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_report_links', function (Blueprint $table) {
            $table->text('password_encrypted')->nullable()->after('password_hash');
            $table->unsignedInteger('reveal_count')->default(0)->after('access_count');
            $table->timestamp('last_revealed_at')->nullable()->after('reveal_count');
        });
    }

    public function down(): void
    {
        Schema::table('project_report_links', function (Blueprint $table) {
            $table->dropColumn(['password_encrypted', 'reveal_count', 'last_revealed_at']);
        });
    }
};
