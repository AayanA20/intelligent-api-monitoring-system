def build_vocab(texts):
    chars = set()

    for t in texts:
        for c in t:
            chars.add(c)

    vocab = {"<pad>": 0}

    for i, c in enumerate(sorted(chars), start=1):
        vocab[c] = i

    return vocab


def encode(text, vocab):
    ids = []

    for c in text[:MAX_LEN]:
        ids.append(vocab.get(c, 0))

    if len(ids) < MAX_LEN:
        ids += [0] * (MAX_LEN - len(ids))

    return ids


def encode_dataset(texts, vocab):
    return [encode(t, vocab) for t in texts]


print("Building vocabulary...")
vocab = build_vocab(train_texts)

train_x = encode_dataset(train_texts, vocab)
val_x = encode_dataset(val_texts, vocab)
test_x = encode_dataset(test_texts, vocab)

ft_x = encode_dataset(ft_texts, vocab)
ft_val_x = encode_dataset(ft_val_texts, vocab)

class APIDataset(Dataset):
    def __init__(self, x, y):
        self.x = torch.tensor(x)
        self.y = torch.tensor(y).float()

    def __len__(self):
        return len(self.x)

    def __getitem__(self, idx):
        return self.x[idx], self.y[idx]


train_loader = DataLoader(APIDataset(train_x, train_labels), batch_size=BATCH_SIZE, shuffle=True)
val_loader = DataLoader(APIDataset(val_x, val_labels), batch_size=BATCH_SIZE)

test_loader = DataLoader(APIDataset(test_x, test_labels), batch_size=BATCH_SIZE)

ft_loader = DataLoader(APIDataset(ft_x, ft_labels), batch_size=BATCH_SIZE, shuffle=True)
ft_val_loader = DataLoader(APIDataset(ft_val_x, ft_val_labels), batch_size=BATCH_SIZE)