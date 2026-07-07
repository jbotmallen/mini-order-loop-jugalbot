<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\Item;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderTransitionController extends Controller
{
    public function store(Request $request, string $orderId)
    {
        $request->validate([
            "action" => "required|in:submit,approve,reject,revise,fulfill,close,cancel",
            "reason" => "nullable|required_if:action,reject|string|max:255",
            "note" => "nullable|string|max:255",
        ], [
            "action.required" => "An action is required: submit, approve, reject, revise, fulfill, close or cancel.",
            "action.in" => "Unknown action - must be submit, approve, reject, revise, fulfill, close or cancel.",
            "reason.required_if" => "A rejection reason is required.",
            "reason.max" => "The rejection reason may not exceed 255 characters.",
            "note.max" => "The note may not exceed 255 characters.",
        ]);

        $order = Order::findOrFail($orderId);

        return match ($request->action) {
            'submit' => $this->submit($request, $order),
            'approve' => $this->approve($request, $order),
            'reject' => $this->reject($request, $order),
            'revise' => $this->revise($request, $order),
            'fulfill' => $this->fulfill($request, $order),
            'close' => $this->close($request, $order),
            'cancel' => $this->cancel($request, $order),
        };
    }

    /**
     * draft -> submitted (owner requester). Guard: >= 1 line, every qty >= 1.
     */
    private function submit(Request $request, Order $order): JsonResponse
    {
        if ($error = $this->requireOwner($request, $order, 'submit')) {
            return $error;
        }
        if ($error = $this->requireStatus($order, [OrderStatus::Draft], 'submit')) {
            return $error;
        }

        if ($order->lines()->count() < 1) {
            return response()->json([
                "message" => "An order needs at least one line before it can be submitted.",
            ], 422);
        }
        if ($order->lines()->where('qty', '<', 1)->exists()) {
            return response()->json([
                "message" => "Every line quantity must be at least 1.",
            ], 422);
        }

        return $this->transition($request, $order, OrderStatus::Submitted);
    }

    /**
     * submitted -> approved (approver). Guard: every line qty <= current stock.
     * Checks stock but does NOT deduct - deduction happens only at fulfill.
     */
    private function approve(Request $request, Order $order): JsonResponse
    {
        if ($error = $this->requireApprover($request, 'approve')) {
            return $error;
        }
        if ($error = $this->requireStatus($order, [OrderStatus::Submitted], 'approve')) {
            return $error;
        }

        $violations = $this->stockViolations($order);
        if ($violations !== []) {
            return response()->json([
                "message" => "Cannot approve - insufficient stock. " . implode('; ', $violations) . ".",
            ], 422);
        }

        return $this->transition($request, $order, OrderStatus::Approved);
    }

    /**
     * submitted -> rejected (approver). Reason required and stored.
     */
    private function reject(Request $request, Order $order): JsonResponse
    {
        if ($error = $this->requireApprover($request, 'reject')) {
            return $error;
        }
        if ($error = $this->requireStatus($order, [OrderStatus::Submitted], 'reject')) {
            return $error;
        }

        return $this->transition($request, $order, OrderStatus::Rejected, $request->reason);
    }

    /**
     * rejected -> draft (owner requester). Lines kept; order editable again.
     */
    private function revise(Request $request, Order $order): JsonResponse
    {
        if ($error = $this->requireOwner($request, $order, 'revise')) {
            return $error;
        }
        if ($error = $this->requireStatus($order, [OrderStatus::Rejected], 'revise')) {
            return $error;
        }

        return $this->transition($request, $order, OrderStatus::Draft);
    }

    /**
     * approved -> fulfilled (approver). Re-check stock and deduct inside one
     * DB transaction with row locks; insufficient stock rolls everything back.
     */
    private function fulfill(Request $request, Order $order): JsonResponse
    {
        if ($error = $this->requireApprover($request, 'fulfill')) {
            return $error;
        }
        if ($error = $this->requireStatus($order, [OrderStatus::Approved], 'fulfill')) {
            return $error;
        }

        DB::transaction(function () use ($request, $order) {
            $deductions = [];
            $violations = [];

            foreach ($order->lines as $line) {
                $item = Item::whereKey($line->item_id)->lockForUpdate()->first();

                if ($line->qty > $item->stock_qty) {
                    $violations[] = "{$item->name} ({$item->sku}): requested {$line->qty}, only {$item->stock_qty} in stock";
                } else {
                    $deductions[] = [$item, $line->qty];
                }
            }

            if ($violations !== []) {
                // Throwing rolls the transaction back - no partial deduction.
                throw ValidationException::withMessages([
                    "stock" => "Cannot fulfill - insufficient stock. " . implode('; ', $violations) . ".",
                ]);
            }

            foreach ($deductions as [$item, $qty]) {
                $item->decrement('stock_qty', $qty);
            }

            $this->applyTransition($request, $order, OrderStatus::Fulfilled);
        });

        return $this->transitionResponse($order, OrderStatus::Fulfilled);
    }

    /**
     * fulfilled -> closed (owner requester). "Received & confirmed."
     */
    private function close(Request $request, Order $order): JsonResponse
    {
        if ($error = $this->requireOwner($request, $order, 'close')) {
            return $error;
        }
        if ($error = $this->requireStatus($order, [OrderStatus::Fulfilled], 'close')) {
            return $error;
        }

        return $this->transition($request, $order, OrderStatus::Closed);
    }

    /**
     * draft/submitted -> cancelled (owner requester). Optional note.
     */
    private function cancel(Request $request, Order $order): JsonResponse
    {
        if ($error = $this->requireOwner($request, $order, 'cancel')) {
            return $error;
        }
        if ($error = $this->requireStatus($order, [OrderStatus::Draft, OrderStatus::Submitted], 'cancel')) {
            return $error;
        }

        return $this->transition($request, $order, OrderStatus::Cancelled, $request->note);
    }

    // ------------------------------------------------------------------
    // Shared guards and helpers
    // ------------------------------------------------------------------

    private function requireOwner(Request $request, Order $order, string $action): ?JsonResponse
    {
        if ($order->user_id !== $request->user()->id) {
            return response()->json([
                "message" => "Only the order's owner can {$action} it.",
            ], 403);
        }

        return null;
    }

    private function requireApprover(Request $request, string $action): ?JsonResponse
    {
        if (!$request->user()->hasRole(UserRole::Approver)) {
            return response()->json([
                "message" => "Only approvers can {$action} orders.",
            ], 403);
        }

        return null;
    }

    /**
     * @param array<OrderStatus> $allowed
     */
    private function requireStatus(Order $order, array $allowed, string $action): ?JsonResponse
    {
        if (!in_array($order->status, $allowed, true)) {
            $expected = implode("' or '", array_column($allowed, 'value'));

            return response()->json([
                "message" => "Cannot {$action} an order in '{$order->status->value}' status - must be '{$expected}'.",
            ], 422);
        }

        return null;
    }

    /**
     * Lines whose qty exceeds current catalog stock, as human-readable strings.
     */
    private function stockViolations(Order $order): array
    {
        $violations = [];

        foreach ($order->lines()->with('item:id,name,sku,stock_qty')->get() as $line) {
            if ($line->qty > $line->item->stock_qty) {
                $violations[] = "{$line->item->name} ({$line->item->sku}): requested {$line->qty}, only {$line->item->stock_qty} in stock";
            }
        }

        return $violations;
    }

    /**
     * Status change + append-only activity log row, atomically.
     */
    private function transition(Request $request, Order $order, OrderStatus $to, ?string $note = null): JsonResponse
    {
        DB::transaction(function () use ($request, $order, $to, $note) {
            $this->applyTransition($request, $order, $to, $note);
        });

        return $this->transitionResponse($order, $to);
    }

    private function applyTransition(Request $request, Order $order, OrderStatus $to, ?string $note = null): void
    {
        $from = $order->status;

        $order->update(["status" => $to->value]);

        ActivityLog::create([
            "order_id" => $order->id,
            "actor_id" => $request->user()->id,
            "from_status" => $from->value,
            "to_status" => $to->value,
            "note" => $note,
        ]);
    }

    private function transitionResponse(Order $order, OrderStatus $to): JsonResponse
    {
        return response()->json([
            "message" => "Order {$to->value} successfully",
            "order" => $order->fresh()->load([
                'lines.item:id,name,sku',
                'requester:id,name',
                'activities.actor:id,name',
            ]),
        ], 200);
    }
}
