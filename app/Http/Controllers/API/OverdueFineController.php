<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\OverdueFineUpdateRequest;
use App\Models\OverdueFine;
use Illuminate\Http\Request;

class OverdueFineController extends Controller
{
    public function index(Request $request)
    {
        $settled = $request->get('settled');
        $fines = OverdueFine::query()
            ->with('transaction')
            ->when(isset($settled), fn($s) => $s->where('settled', (bool)$settled))
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 15));
        return response()->json($fines);
    }

    public function show(OverdueFine $overdue_fine)
    {
        return response()->json($overdue_fine->load('transaction'));
    }

    public function update(OverdueFineUpdateRequest $request, OverdueFine $overdue_fine)
    {
        $overdue_fine->update($request->validated());
        return response()->json($overdue_fine->load('transaction'));
    }

    public function settle(OverdueFine $fine)
    {
        $fine->update([
            'settled' => true,
            'date_settled' => now(),
        ]);
        return response()->json($fine->load('transaction'));
    }
}
