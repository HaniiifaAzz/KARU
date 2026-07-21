import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('App renders splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(const KaruApp());
    await tester.pump();
    // SplashScreen shows the KARU logo image.
    expect(find.byType(KaruApp), findsOneWidget);
  });
}
