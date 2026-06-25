<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sub_tasks', function (Blueprint $table) {
            $table->dropColumn(['target_qty', 'completed_qty', 'unit']);
            $table->boolean('is_completed')->default(false)->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('sub_tasks', function (Blueprint $table) {
            $table->dropColumn('is_completed');
            $table->decimal('target_qty', 15, 2)->nullable()->after('description');
            $table->decimal('completed_qty', 15, 2)->default(0)->after('target_qty');
            $table->string('unit', 50)->nullable()->after('completed_qty');
        });
    }
};
