<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property string $sku
 * @property string $unit_price  decimal:2 cast
 * @property int $stock_qty
 */
class Item extends Model
{
    protected $fillable = [
        'name',
        'sku',
        'unit_price',
        'stock_qty',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'stock_qty' => 'integer',
        ];
    }
}
