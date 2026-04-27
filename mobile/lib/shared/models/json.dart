/// Shared JSON helpers. Centralises the casting boilerplate that
/// `strict-casts: true` requires whenever we cross the
/// `Map<String, dynamic>` boundary returned by `jsonDecode`.
library;

typedef JsonMap = Map<String, Object?>;

extension JsonMapX on JsonMap {
  T req<T>(String key) {
    final value = this[key];
    if (value == null) {
      throw FormatException('Missing required JSON field "$key" in $this');
    }
    if (value is! T) {
      throw FormatException(
        'JSON field "$key" expected $T, got ${value.runtimeType}',
      );
    }
    return value as T;
  }

  T? opt<T>(String key) {
    final value = this[key];
    if (value == null) return null;
    if (value is! T) {
      throw FormatException(
        'JSON field "$key" expected $T?, got ${value.runtimeType}',
      );
    }
    return value as T;
  }

  DateTime reqDate(String key) => DateTime.parse(req<String>(key));
  DateTime? optDate(String key) {
    final raw = opt<String>(key);
    return raw == null ? null : DateTime.parse(raw);
  }

  List<JsonMap> reqList(String key) {
    final raw = req<List<Object?>>(key);
    return raw.cast<JsonMap>();
  }

  List<JsonMap>? optList(String key) {
    final raw = opt<List<Object?>>(key);
    return raw?.cast<JsonMap>();
  }

  List<String>? optStringList(String key) {
    final raw = opt<List<Object?>>(key);
    return raw?.cast<String>();
  }
}

JsonMap stripNulls(JsonMap input) {
  final result = <String, Object?>{};
  input.forEach((k, v) {
    if (v != null) result[k] = v;
  });
  return result;
}
