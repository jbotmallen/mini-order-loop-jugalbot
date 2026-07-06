<?php

namespace Database\Seeders;

use App\Models\Item;
use Illuminate\Database\Seeder;

class ItemSeeder extends Seeder
{
    /**
     * Fixed catalog — deterministic data so every migrate:fresh --seed
     * produces the same demo state.
     */
    public function run(): void
    {
        $items = [
            ['name' => 'A4 Bond Paper (Ream)',       'sku' => 'ITM-001', 'unit_price' => 245.00,  'stock_qty' => 80],
            ['name' => 'Ballpoint Pen (Box of 12)',  'sku' => 'ITM-002', 'unit_price' => 96.50,   'stock_qty' => 60],
            ['name' => 'Heavy-Duty Stapler',         'sku' => 'ITM-003', 'unit_price' => 385.00,  'stock_qty' => 25],
            ['name' => 'USB-C Cable 1m',             'sku' => 'ITM-004', 'unit_price' => 299.00,  'stock_qty' => 45],
            ['name' => 'Wireless Mouse',             'sku' => 'ITM-005', 'unit_price' => 650.00,  'stock_qty' => 30],
            ['name' => 'Mechanical Keyboard',        'sku' => 'ITM-006', 'unit_price' => 1850.00, 'stock_qty' => 15],
            ['name' => 'HDMI Cable 2m',              'sku' => 'ITM-007', 'unit_price' => 420.00,  'stock_qty' => 35],
            ['name' => 'Spiral Notebook A5',         'sku' => 'ITM-008', 'unit_price' => 55.75,   'stock_qty' => 120],
            ['name' => 'Whiteboard Marker Set',      'sku' => 'ITM-009', 'unit_price' => 210.00,  'stock_qty' => 40],
            ['name' => 'External SSD 500GB',         'sku' => 'ITM-010', 'unit_price' => 3450.00, 'stock_qty' => 10],
        ];

        foreach ($items as $item) {
            Item::create($item);
        }
    }
}
