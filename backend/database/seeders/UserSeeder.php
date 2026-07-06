<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Rita Requester',
            'email' => 'requester@demo.test',
            'password' => 'password',
            'role' => UserRole::Requester,
        ]);

        User::create([
            'name' => 'Alan Approver',
            'email' => 'approver@demo.test',
            'password' => 'password',
            'role' => UserRole::Approver,
        ]);
    }
}
