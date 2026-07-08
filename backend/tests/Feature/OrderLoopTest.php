<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Item;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderLoopTest extends TestCase
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
     * The full happy loop through the API:
     * create -> submit -> approve -> fulfill -> close, asserting the status
     * after each step and the stock deduction at fulfill.
     */
    public function test_full_happy_loop_and_stock_deduction(): void
    {
        $requester = $this->requester();
        $approver = $this->approver();

        $widget = Item::create(['name' => 'Widget', 'sku' => 'WGT-1', 'unit_price' => '10.00', 'stock_qty' => 100]);
        $gadget = Item::create(['name' => 'Gadget', 'sku' => 'GDT-1', 'unit_price' => '5.50', 'stock_qty' => 50]);

        // 1. create (requester) -> draft
        Sanctum::actingAs($requester);
        $create = $this->postJson('/api/orders', [
            'remarks' => 'Please rush',
            'lines' => [
                ['item_id' => $widget->id, 'qty' => 4],
                ['item_id' => $gadget->id, 'qty' => 6],
            ],
        ]);
        $create->assertCreated();
        $orderId = $create->json('order.id');
        $this->assertSame('draft', $create->json('order.status'));

        // 2. submit (owner requester) -> submitted
        $this->postJson("/api/orders/{$orderId}/transitions", ['action' => 'submit'])
            ->assertOk()
            ->assertJsonPath('order.status', 'submitted');

        // 3. approve (approver) -> approved. Guard passes: qty <= stock.
        Sanctum::actingAs($approver);
        $this->postJson("/api/orders/{$orderId}/transitions", ['action' => 'approve'])
            ->assertOk()
            ->assertJsonPath('order.status', 'approved');

        // Stock untouched at approve — deduction only happens at fulfill.
        $this->assertSame(100, $widget->fresh()->stock_qty);
        $this->assertSame(50, $gadget->fresh()->stock_qty);

        // 4. fulfill (approver) -> fulfilled, stock deducted.
        $this->postJson("/api/orders/{$orderId}/transitions", ['action' => 'fulfill'])
            ->assertOk()
            ->assertJsonPath('order.status', 'fulfilled');

        $this->assertSame(96, $widget->fresh()->stock_qty);
        $this->assertSame(44, $gadget->fresh()->stock_qty);

        // 5. close (owner requester) -> closed.
        Sanctum::actingAs($requester);
        $this->postJson("/api/orders/{$orderId}/transitions", ['action' => 'close'])
            ->assertOk()
            ->assertJsonPath('order.status', 'closed');

        // Activity log tells the whole story, creation row included.
        $this->assertDatabaseHas('activity_logs', ['order_id' => $orderId, 'to_status' => 'draft', 'from_status' => null]);
        $this->assertDatabaseHas('activity_logs', ['order_id' => $orderId, 'to_status' => 'closed', 'from_status' => 'fulfilled']);
    }
}
