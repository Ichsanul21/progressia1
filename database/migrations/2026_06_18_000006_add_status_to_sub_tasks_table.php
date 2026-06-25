<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sub_tasks', function (Blueprint $table) {
            $table->string('status')->default('not_started')->after('description');
        });

        \DB::statement("UPDATE sub_tasks SET status = 'done' WHERE is_completed = 1");

        Schema::table('sub_tasks', function (Blueprint $table) {
            $table->dropColumn('is_completed');
        });
    }

    public function down(): void
    {
        Schema::table('sub_tasks', function (Blueprint $table) {
            $table->boolean('is_completed')->default(false)->after('description');
        });

        \DB::statement("UPDATE sub_tasks SET is_completed = 1 WHERE status = 'done'");

        Schema::table('sub_tasks', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};