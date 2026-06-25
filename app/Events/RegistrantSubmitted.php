<?php

namespace App\Events;

use App\Models\Registrant;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;

class RegistrantSubmitted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public Registrant $registrant
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.registrants'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'registrant.submitted';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->registrant->id,
            'name' => $this->registrant->name,
            'email' => $this->registrant->email,
            'phone' => $this->registrant->phone,
            'company_name' => $this->registrant->company_name,
            'industry' => $this->registrant->industry,
            'created_at' => $this->registrant->created_at->toISOString(),
        ];
    }
}
