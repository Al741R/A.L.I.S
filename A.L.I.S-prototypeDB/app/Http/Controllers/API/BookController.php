<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\BookRequest;
use App\Models\Book;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class BookController extends Controller
{
    public function index(Request $request)
    {
        try {
            $q = trim((string) $request->get('q',''));
            $categoryId = $request->get('category_id');
            $perPage = $request->integer('per_page', 15);
            $page = $request->integer('page', 1);

        $query = Book::query()
            ->with('category')
            ->when($q !== '', function ($s) use ($q) {
                $s->where(function ($x) use ($q) {
                    $x->where('title','like',"%{$q}%")
                      ->orWhere('author','like',"%{$q}%")
                      ->orWhere('isbn','like',"%{$q}%");
                });
            })
            ->when($categoryId, fn($s) => $s->where('category_id', $categoryId))
            ->orderByDesc('date_added');

        // Simple versioned caching only for the common unfiltered first page lists
        $shouldCache = $q === '' && !$categoryId;
        if (!Cache::has('books:ver')) {
            Cache::forever('books:ver', 1); // initialize version counter
        }
        $version = Cache::get('books:ver', 1);
        if ($shouldCache) {
            $cacheKey = "books:list:v{$version}:per{$perPage}:page{$page}";
            $books = Cache::remember($cacheKey, 60, function () use ($query, $perPage) {
                return $query->paginate($perPage);
            });
        } else {
            $books = $query->paginate($perPage); // filtered queries not cached
        }

            return response()->json($books);
        } catch (\Exception $e) {
            Log::error('Error fetching books', ['error' => $e->getMessage(), 'user' => $request->user()?->id]);
            return response()->json(['message' => 'Error fetching books'], 500);
        }
    }

    public function store(BookRequest $request)
    {
        try {
            $book = Book::create($request->validated());
            Cache::increment('books:ver'); // invalidate cached lists
            $actor = $request->user();
            if ($actor) {
                ActivityLogService::log($actor->id, 'BOOK_CREATED', 'Created book ID '.$book->id.' ('.$book->title.')');
            }
            return response()->json($book->load('category'), 201);
        } catch (\Exception $e) {
            Log::error('Error creating book', ['error' => $e->getMessage(), 'user' => $request->user()?->id, 'data' => $request->validated()]);
            return response()->json(['message' => 'Error creating book'], 500);
        }
    }

    public function show(Book $book)
    {
        return response()->json($book->load('category'));
    }

    public function update(BookRequest $request, Book $book)
    {
        try {
            $book->update($request->validated());
            Cache::increment('books:ver'); // invalidate cached lists
            $actor = $request->user();
            if ($actor) {
                ActivityLogService::log($actor->id, 'BOOK_UPDATED', 'Updated book ID '.$book->id.' ('.$book->title.')');
            }
            return response()->json($book->load('category'));
        } catch (\Exception $e) {
            Log::error('Error updating book', ['error' => $e->getMessage(), 'user' => $request->user()?->id, 'book_id' => $book->id]);
            return response()->json(['message' => 'Error updating book'], 500);
        }
    }

    public function destroy(Book $book)
    {
        try {
            $title = $book->title;
            $id = $book->id;
            $book->delete();
            Cache::increment('books:ver'); // invalidate cached lists
            $actor = request()->user();
            if ($actor) {
                ActivityLogService::log($actor->id, 'BOOK_DELETED', 'Deleted book ID '.$id.' ('.$title.')');
            }
            return response()->noContent();
        } catch (\Exception $e) {
            Log::error('Error deleting book', ['error' => $e->getMessage(), 'user' => request()->user()?->id, 'book_id' => $book->id]);
            return response()->json(['message' => 'Error deleting book. It may have active borrow transactions.'], 500);
        }
    }
}
