<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('start_date')->nullable();
            $table->date('target_date')->nullable();
            $table->decimal('budget', 15, 2)->nullable();
            $table->foreignId('sub_vendor_id')->nullable()->constrained('sub_vendors')->nullOnDelete();
            $table->boolean('review_mode')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');
            $table->dropColumn(['start_date', 'target_date', 'budget']);
            $table->dropConstrainedForeignId('sub_vendor_id');
            $table->dropColumn('review_mode');
        });
    }
};
