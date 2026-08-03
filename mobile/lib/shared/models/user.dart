import 'json.dart';

class User {
  const User({
    required this.id,
    required this.username,
    required this.email,
    required this.dateCreated,
  });

  final String id;
  final String username;
  final String email;
  final DateTime dateCreated;

  factory User.fromJson(JsonMap json) => User(
        id: json.req<String>('id'),
        username: json.req<String>('username'),
        email: json.req<String>('email'),
        dateCreated: json.reqDate('date_created'),
      );

  JsonMap toJson() => {
        'id': id,
        'username': username,
        'email': email,
        'date_created': dateCreated.toIso8601String(),
      };

  @override
  bool operator ==(Object other) =>
      other is User &&
      other.id == id &&
      other.username == username &&
      other.email == email &&
      other.dateCreated == dateCreated;

  @override
  int get hashCode => Object.hash(id, username, email, dateCreated);
}
