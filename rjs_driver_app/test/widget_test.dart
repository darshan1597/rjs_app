import 'package:driver/app/app.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('driver login renders', (tester) async {
    await tester.pumpWidget(const RjsDriverApp());
    expect(find.text('Welcome Back!'), findsOneWidget);
    expect(find.text('Send OTP'), findsOneWidget);
  });
}
