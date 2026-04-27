import '../../shared/models/user.dart';

enum AuthStatus {
  /// Initial state — we haven't checked persisted credentials yet.
  unknown,

  /// No active session.
  unauthenticated,

  /// Login in progress.
  authenticating,

  /// Active session.
  authenticated,

  /// Token refresh in progress.
  refreshing,
}

class AuthState {
  const AuthState({
    required this.status,
    this.user,
    this.errorMessage,
  });

  const AuthState.unknown() : this(status: AuthStatus.unknown);
  const AuthState.unauthenticated({String? error})
      : this(status: AuthStatus.unauthenticated, errorMessage: error);
  const AuthState.authenticating() : this(status: AuthStatus.authenticating);
  const AuthState.authenticated(User user)
      : this(status: AuthStatus.authenticated, user: user);

  final AuthStatus status;
  final User? user;
  final String? errorMessage;

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isResolving =>
      status == AuthStatus.unknown ||
      status == AuthStatus.authenticating ||
      status == AuthStatus.refreshing;

  AuthState copyWith({
    AuthStatus? status,
    User? user,
    String? errorMessage,
    bool clearError = false,
    bool clearUser = false,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: clearUser ? null : (user ?? this.user),
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}
