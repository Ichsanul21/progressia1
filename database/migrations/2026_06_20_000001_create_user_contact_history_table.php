<?php

use App\Models\User;
use App\Models\UserContactHistory;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_contact_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('field', 16);
            $table->string('old_value')->nullable();
            $table->string('new_value')->nullable();
            $table->string('reason')->nullable();
            $table->foreignId('changed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'field', 'created_at']);
            $table->index('field');
        });

        DB::transaction(function () {
            User::withTrashed()->orderBy('id')->each(function (User $user) {
                $hasEmail = UserContactHistory::query()
                    ->where('user_id', $user->id)
                    ->where('field', 'email')
                    ->exists();

                if (! $hasEmail && $user->email) {
                    UserContactHistory::create([
                        'user_id' => $user->id,
                        'field' => 'email',
                        'old_value' => null,
                        'new_value' => $user->email,
                        'reason' => 'initial',
                        'changed_by_user_id' => null,
                    ]);
                }

                $hasPhone = UserContactHistory::query()
                    ->where('user_id', $user->id)
                    ->where('field', 'phone')
                    ->exists();

                if (! $hasPhone && $user->phone) {
                    UserContactHistory::create([
                        'user_id' => $user->id,
                        'field' => 'phone',
                        'old_value' => null,
                        'new_value' => $user->phone,
                        'reason' => 'initial',
                        'changed_by_user_id' => null,
                    ]);
                }
            });
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_contact_history');
    }
};
