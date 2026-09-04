import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/network/customer_auth_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../home/screens/home_screen.dart';
import 'profile_setup_screen.dart';

class OtpVerificationScreen extends StatefulWidget {
  const OtpVerificationScreen({super.key, required this.phone});

  final String phone;

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  Timer? _timer;
  int _expiresIn = 120;
  int _resendIn = 60;
  bool _loading = false;
  bool _resending = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _controller.addListener(_refreshOtpBoxes);
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      if (_expiresIn == 0 && _resendIn == 0) {
        _timer?.cancel();
        return;
      }
      setState(() {
        if (_expiresIn > 0) _expiresIn--;
        if (_resendIn > 0) _resendIn--;
      });
    });
  }

  void _refreshOtpBoxes() {
    if (mounted) setState(() => _error = null);
  }

  String _time(int seconds) =>
      '${(seconds ~/ 60).toString().padLeft(2, '0')}:${(seconds % 60).toString().padLeft(2, '0')}';

  String get _formattedPhone {
    final phone = widget.phone;
    if (phone.length != 10) return phone;
    return '${phone.substring(0, 5)} ${phone.substring(5)}';
  }

  Future<void> _resendOtp() async {
    if (_resendIn > 0 || _resending) return;
    setState(() {
      _resending = true;
      _error = null;
    });
    try {
      await CustomerAuthService.requestOtp(widget.phone);
      if (!mounted) return;
      _controller.clear();
      setState(() {
        _expiresIn = 120;
        _resendIn = 60;
      });
      _startTimer();
      _focusNode.requestFocus();
    } catch (error) {
      if (mounted) {
        setState(
          () => _error = error.toString().replaceFirst('Exception: ', ''),
        );
      }
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  Future<void> _verify() async {
    if (_controller.text.length != 6 || _loading || _expiresIn == 0) {
      if (_expiresIn == 0) {
        setState(() => _error = 'OTP expired. Please request a new OTP.');
      }
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await CustomerAuthService.verifyOtp(
        widget.phone,
        _controller.text,
      );
      if (!mounted) return;
      if (result['isNewCustomer'] == true) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => ProfileSetupScreen(
              registrationToken: result['registrationToken'] as String,
              phone: widget.phone,
            ),
          ),
        );
      } else {
        await CustomerAuthService.saveSession(result);
        if (!mounted) return;
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const HomeScreen()),
          (_) => false,
        );
      }
    } catch (error) {
      if (mounted) {
        setState(
          () => _error = error.toString().replaceFirst('Exception: ', ''),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.removeListener(_refreshOtpBoxes);
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) => SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: EdgeInsets.fromLTRB(
              28,
              12,
              28,
              24 + MediaQuery.paddingOf(context).bottom,
            ),
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: constraints.maxHeight - 36,
              ),
              child: Column(
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(
                        Icons.arrow_back_rounded,
                        color: Colors.black,
                        size: 30,
                      ),
                    ),
                  ),
                  SizedBox(
                    height: (constraints.maxHeight * .015).clamp(4.0, 14.0),
                  ),
                  const _OtpHero(),
                  const SizedBox(height: 25),
                  const Text(
                    'Verify Your Mobile Number',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: AppColors.navy,
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Enter the 6-digit OTP sent to',
                    style: TextStyle(color: AppColors.muted, fontSize: 14),
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.fromLTRB(13, 10, 10, 10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(13),
                      border: Border.all(color: const Color(0xFFD9E0EA)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('🇮🇳', style: TextStyle(fontSize: 19)),
                        const SizedBox(width: 8),
                        Text(
                          '+91 $_formattedPhone',
                          style: const TextStyle(
                            color: AppColors.navy,
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(width: 10),
                        InkWell(
                          onTap: () => Navigator.pop(context),
                          child: const Padding(
                            padding: EdgeInsets.symmetric(
                              horizontal: 3,
                              vertical: 4,
                            ),
                            child: Text(
                              'Change',
                              style: TextStyle(
                                color: AppColors.blue,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  _OtpBoxes(
                    controller: _controller,
                    focusNode: _focusNode,
                    hasError: _error != null,
                  ),
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 9),
                      child: Text(
                        _error!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.red, fontSize: 11),
                      ),
                    ),
                  const SizedBox(height: 17),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.schedule_rounded,
                        size: 17,
                        color: AppColors.muted,
                      ),
                      const SizedBox(width: 6),
                      const Text(
                        'OTP expires in ',
                        style: TextStyle(
                          color: AppColors.muted,
                          fontSize: 12.5,
                        ),
                      ),
                      Text(
                        _time(_expiresIn),
                        style: const TextStyle(
                          color: AppColors.blue,
                          fontSize: 12.5,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 58,
                    child: FilledButton(
                      onPressed: _loading ? null : _verify,
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.orange,
                        disabledBackgroundColor: const Color(0xFFFFA16B),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                        ),
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Center(
                            child: Text(
                              _loading ? 'Verifying...' : 'Verify & Login',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 17,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          const Align(
                            alignment: Alignment.centerRight,
                            child: Icon(
                              Icons.arrow_forward_rounded,
                              color: Colors.white,
                              size: 27,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 26),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(15),
                      border: Border.all(color: const Color(0xFFF0F2F6)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x0D0B275B),
                          blurRadius: 18,
                          offset: Offset(0, 7),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 45,
                          height: 45,
                          decoration: const BoxDecoration(
                            color: Color(0xFFEDF5FF),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.verified_user_outlined,
                            color: AppColors.blue,
                            size: 25,
                          ),
                        ),
                        const SizedBox(width: 13),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                "Didn't receive the OTP?",
                                style: TextStyle(
                                  color: AppColors.navy,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 5),
                              Text.rich(
                                TextSpan(
                                  text:
                                      'Request a new OTP${_resendIn > 0 ? ' in ' : ''}',
                                  style: const TextStyle(
                                    color: AppColors.muted,
                                    fontSize: 11.5,
                                  ),
                                  children: _resendIn > 0
                                      ? [
                                          TextSpan(
                                            text: _time(_resendIn),
                                            style: const TextStyle(
                                              color: AppColors.blue,
                                              fontWeight: FontWeight.w800,
                                            ),
                                          ),
                                        ]
                                      : const [],
                                ),
                              ),
                            ],
                          ),
                        ),
                        OutlinedButton(
                          onPressed: _resendIn == 0 && !_resending
                              ? _resendOtp
                              : null,
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.blue,
                            side: BorderSide(
                              color: _resendIn == 0
                                  ? AppColors.blue
                                  : const Color(0xFFCBD5E4),
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 13,
                              vertical: 12,
                            ),
                          ),
                          child: Text(
                            _resending ? 'Sending...' : 'Resend OTP',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircleAvatar(
                        radius: 20,
                        backgroundColor: Color(0xFFEDF5FF),
                        child: Icon(
                          Icons.lock_outline_rounded,
                          color: AppColors.blue,
                          size: 20,
                        ),
                      ),
                      SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '100% Secure',
                            style: TextStyle(
                              color: AppColors.navy,
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          SizedBox(height: 3),
                          Text(
                            'Your data is safe with us',
                            style: TextStyle(
                              color: AppColors.muted,
                              fontSize: 11.5,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _OtpHero extends StatelessWidget {
  const _OtpHero();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 285,
      width: double.infinity,
      child: Stack(
        alignment: Alignment.topCenter,
        children: [
          Positioned(
            left: -28,
            right: -28,
            bottom: 3,
            height: 190,
            child: Opacity(
              opacity: .72,
              child: Image.asset(
                'assets/images/login-city-background.png',
                fit: BoxFit.cover,
                alignment: Alignment.bottomCenter,
              ),
            ),
          ),
          Positioned(
            top: 0,
            width: 155,
            height: 155,
            child: Image.asset(
              'assets/images/login-logo-transparent.png',
              fit: BoxFit.contain,
              filterQuality: FilterQuality.high,
            ),
          ),
          Positioned(
            left: 7,
            bottom: 0,
            width: 145,
            height: 105,
            child: Image.asset(
              'assets/images/popup-car.png',
              fit: BoxFit.contain,
              alignment: Alignment.bottomCenter,
            ),
          ),
          Positioned(
            bottom: 0,
            width: 182,
            height: 145,
            child: Image.asset(
              'assets/images/popup-bus.png',
              fit: BoxFit.contain,
              alignment: Alignment.bottomCenter,
            ),
          ),
          Positioned(
            right: 0,
            bottom: 0,
            width: 148,
            height: 112,
            child: Image.asset(
              'assets/images/popup-tempo-traveller.png',
              fit: BoxFit.contain,
              alignment: Alignment.bottomCenter,
            ),
          ),
        ],
      ),
    );
  }
}

class _OtpBoxes extends StatelessWidget {
  const _OtpBoxes({
    required this.controller,
    required this.focusNode,
    required this.hasError,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final bool hasError;

  @override
  Widget build(BuildContext context) {
    final digits = controller.text;
    return GestureDetector(
      onTap: focusNode.requestFocus,
      child: Stack(
        children: [
          Row(
            children: List.generate(6, (index) {
              final selected = index == digits.length && digits.length < 6;
              final filled = index < digits.length;
              return Expanded(
                child: Container(
                  height: 56,
                  margin: EdgeInsets.only(right: index == 5 ? 0 : 8),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: hasError
                          ? Colors.red
                          : selected
                          ? AppColors.blue
                          : const Color(0xFFD8DFE9),
                      width: selected ? 1.6 : 1,
                    ),
                  ),
                  child: Text(
                    filled ? digits[index] : '',
                    style: const TextStyle(
                      color: AppColors.navy,
                      fontSize: 23,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              );
            }),
          ),
          Positioned.fill(
            child: Opacity(
              opacity: 0,
              child: TextField(
                controller: controller,
                focusNode: focusNode,
                autofocus: true,
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(6),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
