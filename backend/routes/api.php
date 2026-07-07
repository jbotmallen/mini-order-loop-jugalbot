<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderTransitionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


// auth routes
Route::post('/login', [AuthController::class, 'login']);

// protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'profile']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/items', [ItemController::class, 'index']);

    Route::apiResource('orders', OrderController::class);
    Route::apiResource('orders.transitions', OrderTransitionController::class)->only('store');
});
