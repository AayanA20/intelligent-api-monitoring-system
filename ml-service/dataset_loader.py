def load_json(path):
    with open(path, "r") as f:
        data = json.load(f)

    texts = []
    labels = []

    for r in data:
        req = r["request"]

        method = req.get("method", "")
        url = req.get("url", "")
        body = req.get("body", "")
        tag = req.get("Attack_Tag", "Normal")

        text = method + " " + url + " " + body

        label = 0 if tag == "Normal" else 1

        texts.append(text)
        labels.append(label)

    return texts, labels

print("Loading datasets...")

t1, l1 = load_json("/kaggle/input/datasets/keertishekhawat/abi-abuse-detection-using-lstm/dataset_1_train/dataset_1_train.json")
t2, l2 = load_json("/kaggle/input/datasets/keertishekhawat/abi-abuse-detection-using-lstm/dataset_2_train/dataset_2_train.json")

train_texts = t1 + t2
train_labels = l1 + l2

val_texts, val_labels = load_json("/kaggle/input/datasets/keertishekhawat/abi-abuse-detection-using-lstm/dataset_3_train/dataset_3_train.json")

test_texts, test_labels = load_json("/kaggle/input/datasets/keertishekhawat/abi-abuse-detection-using-lstm/dataset_3_val/dataset_3_val.json")

ft_texts, ft_labels = load_json("/kaggle/input/datasets/keertishekhawat/abi-abuse-detection-using-lstm/dataset_4_train/dataset_4_train.json")

ft_val_texts, ft_val_labels = load_json("/kaggle/input/datasets/keertishekhawat/abi-abuse-detection-using-lstm/dataset_4_val/dataset_4_val.json")


def print_stats(name, labels):
    c = Counter(labels)
    print(name, "Normal:", c[0], "Attack:", c[1])


print_stats("Train", train_labels)
print_stats("Validation", val_labels)
print_stats("Test", test_labels)
print_stats("Finetune Train", ft_labels)
print_stats("Finetune Val", ft_val_labels)
