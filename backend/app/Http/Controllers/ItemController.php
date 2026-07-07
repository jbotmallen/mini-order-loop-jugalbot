<?php

namespace App\Http\Controllers;

use App\Models\Item;

class ItemController extends Controller
{
    /**
     * Catalog listing for the order form.
     */
    public function index()
    {
        return response()->json([
            'data' => Item::orderBy('name')->get(),
            'message' => 'Items fetched successfully',
        ], 200);
    }
}
