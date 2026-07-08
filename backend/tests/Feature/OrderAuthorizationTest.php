<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\Item;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private function requester(): User
    {
        return User::create([
            'name' => 'Rita Requester',
            'email' => 'requester@demo.test',
            'password' => 'password',
            'role' => UserRole::Requester,
        ]);
    }

    private function approver(): User
    {
        return User::create([
            'name' => 'Alan Approver',
            'email' => 'approver@demo.test',
            'password' => 'password',
            'role' => UserRole::Approver,
        ]);
    }

    /**
     * Build a submitted order owned by the requester with one line.
     */
    private function submittedOrder(User $requester, Item $item, int $qty): Order
    {
        $order = Order::create(['user_id' => $requester->id, 'status' => OrderStatus::Submitted->value]);
        OrderLine::create([
            'order_id' => $order->id,
            'item_id' => $item->id,
            'qty' => $qty,
            'unit_price' => $item->unit_price,
        ]);
        ActivityLog::create([
            'order_id' => $order->id,
            'actor_id' => $requester->id,
            'from_status' => null,
            'to_status' => OrderStatus::Draft->value,
        ]);

        return $order;
    }

    /**
     * Forbidden case: a requester attempting to approve is refused (403) and
     * the order status is unchanged.
     */
    public function test_requester_cannot_approve_order(): void
    {
        $requester = $this->requester();
        $item = Item::create(['name' => 'Widget', 'sku' => 'WGT-1', 'unit_price' => '10.00', 'stock_qty' => 100]);
        $order = $this->submittedOrder($requester, $item, 2);

        Sanctum::actingAs($requester);
        $this->postJson("/api/orders/{$order->id}/transitions", ['action' => 'approve'])
            ->assertForbidden();

        $this->assertSame(OrderStatus::Submitted, $order->fresh()->status);
    }

    /**
     * Guard case: approving an order whose qty exceeds current stock fails with
     * 422 and leaves the order submitted (no state change, no deduction).
     */
    public function test_approve_over_stock_is_rejected_and_status_unchanged(): void
    {
        $requester = $this->requester();
        $approver = $this->approver();
        $item = Item::create(['name' => 'Widget', 'sku' => 'WGT-1', 'unit_price' => '10.00', 'stock_qty' => 5]);
        $order = $this->submittedOrder($requester, $item, 999999);

        Sanctum::actingAs($approver);
        $this->postJson("/api/orders/{$order->id}/transitions", ['action' => 'approve'])
            ->assertStatus(422);

        $this->assertSame(OrderStatus::Submitted, $order->fresh()->status);
        // Stock is never touched at approve.
        $this->assertSame(5, $item->fresh()->stock_qty);
    }
}
