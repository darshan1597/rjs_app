import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../home/screens/home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _accepted = true;

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: Colors.white,
    body: SafeArea(
      bottom: false,
      child: LayoutBuilder(
        builder: (context, constraints) => SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: IntrinsicHeight(
              child: Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    height: constraints.maxWidth * .98,
                    child: const _LoginHero(),
                  ),
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 36),
                    child: Column(
                      children: [
                        const Text(
                          'Welcome to RJS Travels',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: AppColors.navy,
                            fontSize: 21,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Login or sign up to continue',
                          style: TextStyle(
                            color: AppColors.muted,
                            fontSize: 13.5,
                          ),
                        ),
                        const SizedBox(height: 28),
                        const Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'Mobile Number',
                            style: TextStyle(
                              color: AppColors.navy,
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          height: 58,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(15),
                            border: Border.all(color: const Color(0xFFDCE1E9)),
                          ),
                          child: Row(
                            children: [
                              const Padding(
                                padding: EdgeInsets.only(left: 14),
                                child: Text(
                                  '🇮🇳',
                                  style: TextStyle(fontSize: 22),
                                ),
                              ),
                              const SizedBox(width: 9),
                              const Text(
                                '+91',
                                style: TextStyle(
                                  color: AppColors.navy,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const Icon(
                                Icons.keyboard_arrow_down_rounded,
                                color: AppColors.muted,
                                size: 20,
                              ),
                              const SizedBox(width: 10),
                              Container(
                                width: 1,
                                height: 28,
                                color: const Color(0xFFE1E4EA),
                              ),
                              const SizedBox(width: 14),
                              const Expanded(
                                child: TextField(
                                  keyboardType: TextInputType.phone,
                                  maxLength: 10,
                                  style: TextStyle(
                                    color: AppColors.navy,
                                    fontSize: 15,
                                  ),
                                  decoration: InputDecoration(
                                    counterText: '',
                                    hintText: 'Enter your mobile number',
                                    hintStyle: TextStyle(
                                      color: Color(0xFF9098AA),
                                    ),
                                    border: InputBorder.none,
                                    isCollapsed: true,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 14),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          height: 58,
                          child: FilledButton(
                            onPressed: _accepted ? _continueToHome : null,
                            style: FilledButton.styleFrom(
                              backgroundColor: AppColors.orange,
                              disabledBackgroundColor: const Color(0xFFFFB282),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(15),
                              ),
                            ),
                            child: const Stack(
                              alignment: Alignment.center,
                              children: [
                                Center(
                                  child: Text(
                                    'Continue',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 17,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: Icon(
                                    Icons.arrow_forward_rounded,
                                    color: Colors.white,
                                    size: 25,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 25),
                        const SizedBox(
                          width: 300,
                          child: Row(
                            children: [
                              Icon(
                                Icons.verified_user_outlined,
                                color: AppColors.blue,
                                size: 24,
                              ),
                              SizedBox(width: 10),
                              Expanded(
                                child: FittedBox(
                                  fit: BoxFit.scaleDown,
                                  alignment: Alignment.centerLeft,
                                  child: Text(
                                    'We’ll send you an OTP to verify your mobile number',
                                    maxLines: 1,
                                    style: TextStyle(
                                      color: AppColors.muted,
                                      fontSize: 11.5,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  Container(
                    width: double.infinity,
                    padding: EdgeInsets.fromLTRB(
                      25,
                      48,
                      25,
                      22 + MediaQuery.paddingOf(context).bottom,
                    ),
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.white, Color(0xFFEAF4FF)],
                      ),
                    ),
                    child: Column(
                      children: [
                        const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.lock_rounded,
                              color: AppColors.muted,
                              size: 14,
                            ),
                            SizedBox(width: 7),
                            Text(
                              '100% Secure',
                              style: TextStyle(
                                color: AppColors.navy,
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            SizedBox(
                              width: 22,
                              height: 22,
                              child: Checkbox(
                                value: _accepted,
                                onChanged: (value) =>
                                    setState(() => _accepted = value ?? false),
                                activeColor: AppColors.orange,
                                side: const BorderSide(color: AppColors.muted),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(4),
                                ),
                              ),
                            ),
                            const SizedBox(width: 9),
                            Flexible(
                              child: Text.rich(
                                TextSpan(
                                  text: 'By continuing, you agree to our ',
                                  style: const TextStyle(
                                    color: AppColors.muted,
                                    fontSize: 10.5,
                                    height: 1.35,
                                  ),
                                  children: [
                                    TextSpan(
                                      text: 'Terms & Conditions',
                                      style: const TextStyle(
                                        color: AppColors.blue,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    const TextSpan(text: ' and '),
                                    TextSpan(
                                      text: 'Privacy Policy',
                                      style: const TextStyle(
                                        color: AppColors.blue,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ],
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    ),
  );

  void _continueToHome() {
    Navigator.of(context).pushReplacement(
      PageRouteBuilder<void>(
        transitionDuration: const Duration(milliseconds: 550),
        pageBuilder: (_, _, _) => const HomeScreen(),
        transitionsBuilder: (_, animation, _, child) => FadeTransition(
          opacity: CurvedAnimation(
            parent: animation,
            curve: Curves.easeInOutCubic,
          ),
          child: child,
        ),
      ),
    );
  }
}

class _LoginHero extends StatelessWidget {
  const _LoginHero();

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: const BoxDecoration(
      gradient: RadialGradient(
        center: Alignment(0, -.25),
        radius: .82,
        colors: [Colors.white, Color(0xFFF3F8FF)],
      ),
    ),
    child: LayoutBuilder(
      builder: (context, constraints) => Stack(
        alignment: Alignment.topCenter,
        children: [
          Positioned(
            top: 14,
            width: constraints.maxWidth * .39,
            height: constraints.maxWidth * .39,
            child: Image.asset(
              'assets/images/login-logo-transparent.png',
              fit: BoxFit.contain,
              filterQuality: FilterQuality.high,
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 34,
            height: constraints.maxHeight * .48,
            child: Image.asset(
              'assets/images/login-city-background.png',
              fit: BoxFit.cover,
              alignment: Alignment.bottomCenter,
              filterQuality: FilterQuality.high,
            ),
          ),
          Positioned(
            left: constraints.maxWidth * .02,
            bottom: 2,
            width: constraints.maxWidth * .37,
            height: constraints.maxHeight * .34,
            child: Image.asset(
              'assets/images/popup-car.png',
              fit: BoxFit.contain,
              alignment: Alignment.bottomCenter,
              filterQuality: FilterQuality.high,
            ),
          ),
          Positioned(
            bottom: 0,
            width: constraints.maxWidth * .47,
            height: constraints.maxHeight * .45,
            child: Image.asset(
              'assets/images/popup-bus.png',
              fit: BoxFit.contain,
              alignment: Alignment.bottomCenter,
              filterQuality: FilterQuality.high,
            ),
          ),
          Positioned(
            right: constraints.maxWidth * .015,
            bottom: 2,
            width: constraints.maxWidth * .38,
            height: constraints.maxHeight * .36,
            child: Image.asset(
              'assets/images/popup-tempo-traveller.png',
              fit: BoxFit.contain,
              alignment: Alignment.bottomCenter,
              filterQuality: FilterQuality.high,
            ),
          ),
        ],
      ),
    ),
  );
}
