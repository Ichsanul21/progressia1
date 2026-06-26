<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            try {
                $table->dropUnique(['email']);
            } catch (\Throwable $e) {
                
            }
        });

        // Untuk MariaDB gunakan unique biasa
        Schema::table('users', function (Blueprint $table) {
            $table->unique('email', 'users_email_unique');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            try {
                $table->dropUnique('users_email_unique');
            } catch (\Throwable $e) {
                
            }

            $table->unique('email');
        });
    }
};