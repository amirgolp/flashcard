import 'json.dart';

class Chapter {
  const Chapter({
    required this.name,
    required this.startPage,
    required this.endPage,
  });

  final String name;
  final int startPage;
  final int endPage;

  factory Chapter.fromJson(JsonMap json) => Chapter(
        name: json.req<String>('name'),
        startPage: json.req<int>('start_page'),
        endPage: json.req<int>('end_page'),
      );

  JsonMap toJson() => {
        'name': name,
        'start_page': startPage,
        'end_page': endPage,
      };
}

class PageRange {
  const PageRange({required this.start, required this.end});

  final int start;
  final int end;

  factory PageRange.fromJson(JsonMap json) => PageRange(
        start: json.req<int>('start'),
        end: json.req<int>('end'),
      );

  JsonMap toJson() => {'start': start, 'end': end};
}

class Book {
  const Book({
    required this.id,
    required this.title,
    required this.filename,
    required this.totalPages,
    required this.dateCreated,
    required this.lastEdited,
    this.targetLanguage,
    this.nativeLanguage,
    this.chapters = const [],
  });

  final String id;
  final String title;
  final String filename;
  final int totalPages;
  final List<Chapter> chapters;
  final String? targetLanguage;
  final String? nativeLanguage;
  final DateTime dateCreated;
  final DateTime lastEdited;

  factory Book.fromJson(JsonMap json) => Book(
        id: json.req<String>('id'),
        title: json.req<String>('title'),
        filename: json.req<String>('filename'),
        totalPages: json.req<int>('total_pages'),
        chapters: (json.optList('chapters') ?? const [])
            .map(Chapter.fromJson)
            .toList(growable: false),
        targetLanguage: json.opt<String>('target_language'),
        nativeLanguage: json.opt<String>('native_language'),
        dateCreated: json.reqDate('date_created'),
        lastEdited: json.reqDate('last_edited'),
      );
}

class BookUpdate {
  const BookUpdate({
    this.title,
    this.targetLanguage,
    this.nativeLanguage,
    this.chapters,
  });

  final String? title;
  final String? targetLanguage;
  final String? nativeLanguage;
  final List<Chapter>? chapters;

  JsonMap toJson() => stripNulls({
        'title': title,
        'target_language': targetLanguage,
        'native_language': nativeLanguage,
        'chapters': chapters?.map((c) => c.toJson()).toList(),
      });
}

class BookProgress {
  const BookProgress({
    required this.id,
    required this.bookId,
    required this.currentPage,
    required this.dateCreated,
    required this.lastEdited,
    this.currentChapter,
    this.pagesProcessed = const [],
    this.chaptersCompleted = const [],
  });

  final String id;
  final String bookId;
  final int currentPage;
  final String? currentChapter;
  final List<PageRange> pagesProcessed;
  final List<String> chaptersCompleted;
  final DateTime dateCreated;
  final DateTime lastEdited;

  factory BookProgress.fromJson(JsonMap json) => BookProgress(
        id: json.req<String>('id'),
        bookId: json.req<String>('book_id'),
        currentPage: json.req<int>('current_page'),
        currentChapter: json.opt<String>('current_chapter'),
        pagesProcessed: (json.optList('pages_processed') ?? const [])
            .map(PageRange.fromJson)
            .toList(growable: false),
        chaptersCompleted: json.optStringList('chapters_completed') ?? const [],
        dateCreated: json.reqDate('date_created'),
        lastEdited: json.reqDate('last_edited'),
      );
}

class BookProgressUpdate {
  const BookProgressUpdate({this.currentPage, this.currentChapter});

  final int? currentPage;
  final String? currentChapter;

  JsonMap toJson() => stripNulls({
        'current_page': currentPage,
        'current_chapter': currentChapter,
      });
}
