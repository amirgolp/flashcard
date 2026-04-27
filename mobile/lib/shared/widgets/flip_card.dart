import 'dart:math' as math;

import 'package:flutter/material.dart';

/// 3D flip-card. Tap to toggle between [front] and [back]. Implementation
/// keeps both children in the tree so they can hold their own state, and
/// rotates the front 0..π and the back π..0 simultaneously, hiding the
/// face that's currently turned away.
class FlipCard extends StatefulWidget {
  const FlipCard({
    required this.front,
    required this.back,
    this.duration = const Duration(milliseconds: 350),
    super.key,
  });

  final Widget front;
  final Widget back;
  final Duration duration;

  @override
  State<FlipCard> createState() => FlipCardState();
}

class FlipCardState extends State<FlipCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;
  bool _showingFront = true;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration);
    _animation = Tween<double>(begin: 0, end: math.pi).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void toggle() {
    if (_showingFront) {
      _controller.forward(from: 0);
    } else {
      _controller.reverse(from: 1);
    }
    setState(() => _showingFront = !_showingFront);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: toggle,
      child: AnimatedBuilder(
        animation: _animation,
        builder: (context, _) {
          final angle = _animation.value;
          final isFront = angle <= math.pi / 2;
          final transform = Matrix4.identity()
            ..setEntry(3, 2, 0.001) // perspective
            ..rotateY(angle);
          return Transform(
            alignment: Alignment.center,
            transform: transform,
            child: isFront
                ? widget.front
                : Transform(
                    alignment: Alignment.center,
                    transform: Matrix4.identity()..rotateY(math.pi),
                    child: widget.back,
                  ),
          );
        },
      ),
    );
  }
}
