<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->boolean('is_recurring')->default(false)->after('progress');
            $table->string('recurrence_frequency')->nullable()->after('is_recurring');
            $table->unsignedTinyInteger('recurrence_interval')->nullable()->after('recurrence_frequency');
            $table->date('recurrence_end_date')->nullable()->after('recurrence_interval');
            $table->json('recurrence_days')->nullable()->after('recurrence_end_date');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['is_recurring', 'recurrence_frequency', 'recurrence_interval', 'recurrence_end_date', 'recurrence_days']);
        });
    }
};
