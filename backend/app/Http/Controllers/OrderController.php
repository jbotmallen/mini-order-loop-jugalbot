<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\Item;
use App\Models\Order;
use App\Models\OrderLine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $request->validate([
            "status" => ["nullable", Rule::in(array_column(OrderStatus::cases(), 'value'))],
            "search" => "nullable|string|max:50",
            "per_page" => "nullable|integer|min:1|max:100",
        ], [
            "status.in" => "Status must be one of: " . implode(', ', array_column(OrderStatus::cases(), 'value')) . ".",
            "search.max" => "Search text may not exceed 50 characters.",
            "per_page.integer" => "Per-page must be a whole number.",
            "per_page.min" => "Per-page must be at least 1.",
            "per_page.max" => "Per-page may not exceed 100.",
        ]);

        $query = Order::query()
            ->with('requester:id,name')
            ->withCount('lines')
            ->withSum('lines', 'line_total')
            ->withMax('activities', 'created_at');

        if ($request->user()->hasRole(UserRole::Requester)) {
            $query->where('user_id', $request->user()->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $query->where('number', 'ilike', '%' . $request->query('search') . '%');
        }

        $orders = $query->latest()->paginate((int) $request->query('per_page', 10));

        return response()->json([
            'data' => $orders->items(),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
            'message' => 'Orders fetched successfully',
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        if (!$request->user()->hasRole(UserRole::Requester)) {
            return response()->json([
                "message" => "Only requesters can create orders",
            ], 403);
        }

        $request->validate($this->lineRules(), $this->lineMessages());

        $order = DB::transaction(function () use ($request) {
            $order = Order::create([
                "user_id" => $request->user()->id,
                "remarks" => $request->remarks,
            ]);

            $this->createLines($order, $request->lines ?? []);

            ActivityLog::create([
                "order_id" => $order->id,
                "actor_id" => $request->user()->id,
                "from_status" => null,
                "to_status" => OrderStatus::Draft->value,
            ]);

            return $order;
        });

        return response()->json([
            "message" => "Order created successfully",
            "order" => $order->load('lines.item:id,name,sku'),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id)
    {
        $order = Order::with(['lines.item:id,name,sku', 'requester:id,name', 'activities.actor:id,name'])
            ->findOrFail($id);

        if ($request->user()->hasRole(UserRole::Requester) && $order->user_id !== $request->user()->id) {
            return response()->json([
                "message" => "Unauthorized to view this order",
            ], 403);
        }

        return response()->json([
            "message" => "Order fetched successfully",
            "order" => $order,
            "total" => $order->total(),
        ], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $order = Order::findOrFail($id);

        if ($order->user_id !== $request->user()->id) {
            return response()->json([
                "message" => "Only the order's owner can edit it",
            ], 403);
        }

        if ($order->status !== OrderStatus::Draft) {
            return response()->json([
                "message" => "Only draft orders can be edited",
            ], 422);
        }

        $request->validate($this->lineRules(), $this->lineMessages());

        DB::transaction(function () use ($request, $order) {
            if ($request->has('remarks')) {
                $order->update(["remarks" => $request->remarks]);
            }

            if ($request->has('lines')) {
                $order->lines()->delete();
                $this->createLines($order, $request->lines ?? []);
            }
        });

        return response()->json([
            "message" => "Order updated successfully",
            "order" => $order->fresh()->load('lines.item:id,name,sku'),
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id)
    {
        $order = Order::findOrFail($id);

        if ($order->user_id !== $request->user()->id) {
            return response()->json([
                "message" => "Only the order's owner can delete it",
            ], 403);
        }

        if ($order->status !== OrderStatus::Draft) {
            return response()->json([
                "message" => "Only draft orders can be deleted",
            ], 422);
        }

        $order->delete();

        return response()->json([
            "message" => "Order deleted successfully",
        ], 200);
    }

    private function lineRules(): array
    {
        return [
            "remarks" => "nullable|string|max:255",
            "lines" => "nullable|array|max:20",
            "lines.*.item_id" => "required|integer|distinct|exists:items,id",
            "lines.*.qty" => "required|integer|min:1|max:999999",
        ];
    }

    private function lineMessages(): array
    {
        return [
            "remarks.max" => "Remarks may not exceed 255 characters.",
            "lines.array" => "Lines must be a list of items with quantities.",
            "lines.max" => "An order may have at most 20 lines.",
            "lines.*.item_id.required" => "Line :position is missing an item.",
            "lines.*.item_id.integer" => "Line :position has an invalid item id.",
            "lines.*.item_id.distinct" => "Line :position uses the same item as another line — edit that line's quantity instead.",
            "lines.*.item_id.exists" => "Line :position refers to an item that does not exist.",
            "lines.*.qty.required" => "Line :position is missing a quantity.",
            "lines.*.qty.integer" => "Line :position quantity must be a whole number.",
            "lines.*.qty.min" => "Line :position quantity must be at least 1.",
            "lines.*.qty.max" => "Line :position quantity may not exceed 999999.",
        ];
    }

    /**
     * Create order lines, snapshotting the catalog unit_price at add time.
     * line_total is computed by the OrderLine saving hook.
     */
    private function createLines(Order $order, array $lines): void
    {
        foreach ($lines as $line) {
            $item = Item::findOrFail($line["item_id"]);

            OrderLine::create([
                "order_id" => $order->id,
                "item_id" => $item->id,
                "qty" => $line["qty"],
                "unit_price" => $item->unit_price,
            ]);
        }
    }
}
