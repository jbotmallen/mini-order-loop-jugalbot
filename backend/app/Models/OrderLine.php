<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $order_id
 * @property int $item_id
 * @property int $qty
 * @property string $unit_price  decimal:2 cast — PHP has no decimal type, Laravel returns strings
 * @property string $line_total  decimal:2 cast
 * @property-read Order $order
 * @property-read Item $item
 */
class OrderLine extends Model
{
    protected $fillable = [
        'order_id',
        'item_id',
        'qty',
        'unit_price',
        'line_total',
    ];

    protected function casts(): array
    {
        return [
            'qty' => 'integer',
            'unit_price' => 'decimal:2',
            'line_total' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        // line_total is always derived; keeping synced means no caller can forget it.
        static::saving(function (OrderLine $line) {
            $line->line_total = bcmul((string) $line->qty, (string) $line->unit_price, 2);
        });
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
