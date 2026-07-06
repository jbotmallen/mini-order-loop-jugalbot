<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string|null $number  null only between INSERT and the created hook
 * @property OrderStatus $status
 * @property string|null $remarks
 * @property int $user_id
 * @property-read User $requester
 * @property-read \Illuminate\Database\Eloquent\Collection<int, OrderLine> $lines
 * @property-read \Illuminate\Database\Eloquent\Collection<int, ActivityLog> $activities
 */
class Order extends Model
{
    protected $fillable = [
        'status',
        'remarks',
        'user_id',
    ];

    protected $attributes = [
        'status' => OrderStatus::Draft->value,
    ];

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
        ];
    }

    protected static function booted(): void
    {
        static::created(function (Order $order) {
            $order->number = 'ORD-'.str_pad((string) $order->id, 5, '0', STR_PAD_LEFT);
            $order->saveQuietly();
        });
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(OrderLine::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function total(): string
    {
        return (string) $this->lines->sum('line_total');
    }
}
