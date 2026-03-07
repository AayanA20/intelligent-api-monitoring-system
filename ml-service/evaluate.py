def evaluate(loader):
    model.eval()
    preds, targets = [], []
    with torch.no_grad():
        for x, y in loader:
            x = x.to(DEVICE)
            logits = model(x)                        # raw logits
            probs  = torch.sigmoid(logits)           # sigmoid ONCE here
            preds.extend(probs.cpu().numpy())
            targets.extend(y.numpy())

    preds_bin = [1 if p > 0.5 else 0 for p in preds]
    return (
        accuracy_score(targets, preds_bin),
        precision_score(targets, preds_bin, zero_division=0),
        recall_score(targets, preds_bin, zero_division=0),
        f1_score(targets, preds_bin, zero_division=0),
        roc_auc_score(targets, preds)
    )
