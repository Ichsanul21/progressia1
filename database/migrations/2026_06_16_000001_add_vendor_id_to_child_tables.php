<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('approvals', function (Blueprint $table) {
            $table->foreignId('vendor_id')->nullable()->constrained()->nullOnDelete();
            $table->index('vendor_id');
        });

        Schema::table('task_comments', function (Blueprint $table) {
            $table->foreignId('vendor_id')->nullable()->constrained()->nullOnDelete();
            $table->index('vendor_id');
        });

        Schema::table('task_attachments', function (Blueprint $table) {
            $table->foreignId('vendor_id')->nullable()->constrained()->nullOnDelete();
            $table->index('vendor_id');
        });

        Schema::table('progress_updates', function (Blueprint $table) {
            $table->foreignId('vendor_id')->nullable()->constrained()->nullOnDelete();
            $table->index('vendor_id');
        });

        Schema::table('progress_photos', function (Blueprint $table) {
            $table->foreignId('vendor_id')->nullable()->constrained()->nullOnDelete();
            $table->index('vendor_id');
        });
    }

    public function down(): void
    {
        Schema::table('approvals', fn (Blueprint $table) => $table->dropColumn('vendor_id'));
        Schema::table('task_comments', fn (Blueprint $table) => $table->dropColumn('vendor_id'));
        Schema::table('task_attachments', fn (Blueprint $table) => $table->dropColumn('vendor_id'));
        Schema::table('progress_updates', fn (Blueprint $table) => $table->dropColumn('vendor_id'));
        Schema::table('progress_photos', fn (Blueprint $table) => $table->dropColumn('vendor_id'));
    }
};
