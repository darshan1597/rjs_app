import 'package:flutter/material.dart';

Future<int?> showWalletTopupDialog(BuildContext context) async {
  final route = DialogRoute<int>(
    context: context,
    builder: (_) => const WalletTopupDialog(),
  );
  final amount = await Navigator.of(context).push<int>(route);
  // A pop result arrives before the closing animation has disposed the form.
  // Do not open native checkout while the dialog is still being torn down.
  await route.completed;
  return amount;
}

class WalletTopupDialog extends StatefulWidget {
  const WalletTopupDialog({super.key});
  @override
  State<WalletTopupDialog> createState() => _WalletTopupDialogState();
}

class _WalletTopupDialogState extends State<WalletTopupDialog> {
  final _controller = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _closing = false;
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _continue() {
    if (_closing || !_formKey.currentState!.validate()) return;
    _closing = true;
    FocusScope.of(context).unfocus();
    Navigator.of(context).pop(int.parse(_controller.text.trim()) * 100);
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: const Text('Add money'),
    content: Form(
      key: _formKey,
      child: TextFormField(
        controller: _controller,
        keyboardType: TextInputType.number,
        textInputAction: TextInputAction.done,
        onFieldSubmitted: (_) => _continue(),
        validator: (value) {
          final amount = int.tryParse(value?.trim() ?? '');
          return amount == null || amount < 100 || amount > 10000
              ? 'Enter a whole-rupee amount from ₹100 to ₹10,000'
              : null;
        },
        decoration: const InputDecoration(
          labelText: 'Amount in rupees', helperText: '₹100–₹10,000 per top-up',
        ),
      ),
    ),
    actions: [
      TextButton(onPressed: () {
        if (_closing) return;
        _closing = true;
        FocusScope.of(context).unfocus();
        Navigator.of(context).pop();
      }, child: const Text('Cancel')),
      FilledButton(onPressed: _continue, child: const Text('Continue')),
    ],
  );
}
