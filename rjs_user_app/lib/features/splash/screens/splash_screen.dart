import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../auth/screens/login_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _entrance;
  bool _started = false;
  bool _showLogin = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    );
    _entrance = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    WidgetsBinding.instance.addPostFrameCallback((_) => _prepareAndStart());
  }

  Future<void> _prepareAndStart() async {
    await Future.wait([
      precacheImage(const AssetImage('assets/images/rjs_hero.png'), context),
      precacheImage(
        const AssetImage('assets/images/rjs-logo-official.png'),
        context,
      ),
      precacheImage(const AssetImage('assets/images/ride-sedan.png'), context),
      precacheImage(const AssetImage('assets/images/ride-suv.png'), context),
      precacheImage(
        const AssetImage('assets/images/safety-banner.png'),
        context,
      ),
      precacheImage(
        const AssetImage('assets/images/book-fleet-popout-3d-transparent.png'),
        context,
      ),
      precacheImage(
        const AssetImage('assets/images/login-logo-transparent.png'),
        context,
      ),
      precacheImage(
        const AssetImage('assets/images/login-city-background.png'),
        context,
      ),
      precacheImage(const AssetImage('assets/images/popup-car.png'), context),
      precacheImage(const AssetImage('assets/images/popup-bus.png'), context),
      precacheImage(
        const AssetImage('assets/images/popup-tempo-traveller.png'),
        context,
      ),
    ]);
    if (!mounted) return;
    await _controller.forward();
    _openLogin();
  }

  void _openLogin() {
    if (!mounted) return;
    setState(() => _showLogin = true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedSwitcher(
    duration: const Duration(milliseconds: 1100),
    switchInCurve: Curves.easeInOutCubic,
    switchOutCurve: Curves.easeInOutCubic,
    layoutBuilder: (currentChild, previousChildren) => Stack(
      fit: StackFit.expand,
      children: [...previousChildren, ?currentChild],
    ),
    transitionBuilder: (child, animation) => FadeTransition(
      opacity: CurvedAnimation(parent: animation, curve: Curves.easeInOutCubic),
      child: child,
    ),
    child: _showLogin
        ? const LoginScreen(key: ValueKey('login-screen'))
        : _splashContent(),
  );

  Widget _splashContent() => Scaffold(
    key: const ValueKey('splash-screen'),
    backgroundColor: const Color(0xFFF4F8FF),
    body: Stack(
      fit: StackFit.expand,
      children: [
        FadeTransition(
          opacity: _entrance,
          child: ScaleTransition(
            scale: Tween<double>(begin: 1.035, end: 1).animate(_entrance),
            child: Image.asset(
              'assets/images/rjs-splash-background.png',
              fit: BoxFit.cover,
              alignment: Alignment.topCenter,
              filterQuality: FilterQuality.high,
            ),
          ),
        ),
        Positioned(
          left: 0,
          right: 0,
          bottom: MediaQuery.sizeOf(context).height * .075,
          child: FadeTransition(
            opacity: _entrance,
            child: const Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 43,
                  height: 43,
                  child: CircularProgressIndicator(
                    strokeWidth: 4,
                    backgroundColor: Color(0xFFDDE8FA),
                    color: AppColors.blue,
                    strokeCap: StrokeCap.round,
                  ),
                ),
                SizedBox(height: 20),
                Text(
                  'L O A D I N G . . .',
                  style: TextStyle(
                    color: AppColors.blue,
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 2.2,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}
