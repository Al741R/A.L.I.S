<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $names = ['Fiction', 'Non-fiction', 'Science', 'History', 'Reference'];
        foreach ($names as $name) {
            Category::firstOrCreate(['category_name' => $name]);
        }
    }
}
