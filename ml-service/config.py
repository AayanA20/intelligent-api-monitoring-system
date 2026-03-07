import json
import torch
import numpy as np
from collections import Counter
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from torch.utils.data import Dataset, DataLoader
import torch.nn as nn

# -----------------------------
# CONFIG
# -----------------------------
EPOCHS      = 30
LEARNING_RATE = 1e-3
PATIENCE    = 10
GRAD_CLIP   = 1.0
EMBED_DIM   = 64
HIDDEN_DIM  = 128
MAX_LEN     = 200
BATCH_SIZE  = 64