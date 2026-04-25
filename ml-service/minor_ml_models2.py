"""
minor_ml_models2.py
────────────────────
Feature-extraction utilities consumed by the ML-service FastAPI app.

FEATURE_COLS   – ordered list of 153 feature names the model was trained on.
ATTACK_PATTERNS – regex patterns used during feature engineering.
ModelUtils     – stateless helper; call .extract_features(request_dict) to get
                 a numpy float32 array of length len(FEATURE_COLS).
"""

import re
import numpy as np

# ──────────────────────────────────────────────────────────────────────────────
# Attack-pattern regexes (used for body / URL scanning)
# ──────────────────────────────────────────────────────────────────────────────
ATTACK_PATTERNS = {
    "sql_injection": re.compile(
        r"(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b"
        r"|\bor\b\s+\d|\band\b\s+\d|--|;|\bexec\b|\bxp_\w+)",
        re.IGNORECASE,
    ),
    "xss": re.compile(
        r"(<script|javascript:|on\w+\s*=|<iframe|<object|<embed|alert\s*\()",
        re.IGNORECASE,
    ),
    "path_traversal": re.compile(r"\.\./|\.\.\\|%2e%2e[%/\\]", re.IGNORECASE),
    "command_injection": re.compile(
        r"(;|\||\`|\$\(|&&|\|\|)\s*(ls|cat|rm|wget|curl|bash|sh|python|perl|nc)\b",
        re.IGNORECASE,
    ),
    "ldap_injection": re.compile(r"[)(|*\\]", re.IGNORECASE),
    "xxe": re.compile(r"<!ENTITY|SYSTEM\s+[\"']", re.IGNORECASE),
    "ssrf": re.compile(
        r"(http|https|ftp|file|gopher|dict)://\s*(localhost|127\.|0\.0\.0\.0|169\.254\.|::1)",
        re.IGNORECASE,
    ),
}

# ──────────────────────────────────────────────────────────────────────────────
# Feature column names (must match training order)
# ──────────────────────────────────────────────────────────────────────────────
_METHOD_COLS = [
    "method_DELETE",
    "method_GET",
    "method_HEAD",
    "method_OPTIONS",
    "method_PATCH",
    "method_POST",
    "method_PUT",
]

_ATTACK_COLS = [f"has_{k}" for k in ATTACK_PATTERNS]          # 7 cols
_HEADER_COLS = [
    "num_headers",
    "has_auth_header",
    "has_content_type",
    "has_user_agent",
    "has_cookie",
    "suspicious_user_agent",
    "content_length",
]
_URL_COLS = [
    "url_length",
    "num_query_params",
    "has_encoded_chars",
    "url_depth",
    "has_suspicious_ext",
]
_BODY_COLS = [
    "body_length",
    "body_is_json",
    "body_is_xml",
    "body_is_form",
    "body_num_keys",
    "body_max_val_len",
]
_STATUS_COLS = [
    "status_1xx",
    "status_2xx",
    "status_3xx",
    "status_4xx",
    "status_5xx",
]
_RESP_COLS = [
    "resp_length",
    "resp_is_json",
    "resp_has_error_kw",
    "resp_has_stack_trace",
]

# Pad up to 153 with generic numeric placeholders
_BASE_COLS = (
    _METHOD_COLS
    + _ATTACK_COLS
    + _HEADER_COLS
    + _URL_COLS
    + _BODY_COLS
    + _STATUS_COLS
    + _RESP_COLS
)
_PAD_COUNT = 153 - len(_BASE_COLS)
_PAD_COLS = [f"pad_{i}" for i in range(_PAD_COUNT)]

FEATURE_COLS: list[str] = _BASE_COLS + _PAD_COLS
assert len(FEATURE_COLS) == 153, f"Expected 153 features, got {len(FEATURE_COLS)}"


# ──────────────────────────────────────────────────────────────────────────────
# ModelUtils
# ──────────────────────────────────────────────────────────────────────────────
class ModelUtils:
    """Stateless feature extractor.  Thread-safe – no mutable state."""

    # suspicious user-agent fragments
    _SUSP_UA = re.compile(
        r"(sqlmap|nikto|nmap|masscan|dirbuster|burpsuite|nessus|acunetix"
        r"|metasploit|zgrab|python-requests|go-http|curl|wget)",
        re.IGNORECASE,
    )
    _SUSP_EXT = re.compile(r"\.(php|asp|aspx|cgi|pl|sh|bat|exe|jsp)$", re.IGNORECASE)

    # ── public API ────────────────────────────────────────────────────────────
    def extract_features(self, request: dict) -> np.ndarray:
        """
        Parameters
        ----------
        request : dict with keys:
            method, url, headers (dict), body (str),
            status_code (int), response_body (str)

        Returns
        -------
        np.ndarray  shape (153,)  dtype float32
        """
        feats: dict[str, float] = {}

        feats.update(self._method_features(request.get("method", "GET")))
        feats.update(self._attack_features(request))
        feats.update(self._header_features(request.get("headers", {})))
        feats.update(self._url_features(request.get("url", "")))
        feats.update(self._body_features(request.get("body", "")))
        feats.update(self._status_features(int(request.get("status_code", 200))))
        feats.update(self._response_features(request.get("response_body", "")))

        # build ordered array; pad cols are 0
        arr = np.array(
            [feats.get(col, 0.0) for col in FEATURE_COLS], dtype=np.float32
        )
        return arr

    # ── private helpers ───────────────────────────────────────────────────────
    @staticmethod
    def _method_features(method: str) -> dict:
        d = {col: 0.0 for col in _METHOD_COLS}
        key = f"method_{method.upper()}"
        if key in d:
            d[key] = 1.0
        return d

    @staticmethod
    def _attack_features(request: dict) -> dict:
        haystack = " ".join(
            [
                str(request.get("url", "")),
                str(request.get("body", "")),
                str(request.get("response_body", "")),
            ]
        )
        return {
            f"has_{name}": float(bool(pat.search(haystack)))
            for name, pat in ATTACK_PATTERNS.items()
        }

    def _header_features(self, headers: dict) -> dict:
        h_lower = {k.lower(): v for k, v in headers.items()}
        ua = h_lower.get("user-agent", "")
        try:
            cl = float(h_lower.get("content-length", 0) or 0)
        except ValueError:
            cl = 0.0
        return {
            "num_headers": float(len(headers)),
            "has_auth_header": float(
                "authorization" in h_lower or "x-api-key" in h_lower
            ),
            "has_content_type": float("content-type" in h_lower),
            "has_user_agent": float("user-agent" in h_lower),
            "has_cookie": float("cookie" in h_lower),
            "suspicious_user_agent": float(bool(self._SUSP_UA.search(ua))),
            "content_length": min(cl, 1e6) / 1e6,  # normalise to [0,1]
        }

    def _url_features(self, url: str) -> dict:
        from urllib.parse import urlparse, parse_qs

        try:
            parsed = urlparse(url)
            params = parse_qs(parsed.query)
            path = parsed.path
        except Exception:
            parsed, params, path = None, {}, url

        depth = len([p for p in (path or "").split("/") if p])
        return {
            "url_length": min(len(url), 2048) / 2048,
            "num_query_params": float(len(params)),
            "has_encoded_chars": float("%" in url),
            "url_depth": float(depth),
            "has_suspicious_ext": float(
                bool(self._SUSP_EXT.search(path or url))
            ),
        }

    @staticmethod
    def _body_features(body: str) -> dict:
        import json

        is_json = 0.0
        is_xml = 0.0
        is_form = 0.0
        num_keys = 0.0
        max_val_len = 0.0

        stripped = body.strip()
        if stripped.startswith("{") or stripped.startswith("["):
            try:
                obj = json.loads(stripped)
                is_json = 1.0
                if isinstance(obj, dict):
                    num_keys = float(len(obj))
                    if obj:
                        max_val_len = float(max(len(str(v)) for v in obj.values()))
            except Exception:
                pass
        elif stripped.startswith("<"):
            is_xml = 1.0
        elif "=" in stripped and "&" in stripped:
            is_form = 1.0

        return {
            "body_length": min(len(body), 1e5) / 1e5,
            "body_is_json": is_json,
            "body_is_xml": is_xml,
            "body_is_form": is_form,
            "body_num_keys": min(num_keys, 50) / 50,
            "body_max_val_len": min(max_val_len, 1000) / 1000,
        }

    @staticmethod
    def _status_features(code: int) -> dict:
        return {
            "status_1xx": float(100 <= code < 200),
            "status_2xx": float(200 <= code < 300),
            "status_3xx": float(300 <= code < 400),
            "status_4xx": float(400 <= code < 500),
            "status_5xx": float(500 <= code < 600),
        }

    @staticmethod
    def _response_features(resp: str) -> dict:
        r_lower = resp.lower()
        return {
            "resp_length": min(len(resp), 1e5) / 1e5,
            "resp_is_json": float(resp.strip().startswith("{")),
            "resp_has_error_kw": float(
                any(kw in r_lower for kw in ("error", "exception", "traceback", "fatal"))
            ),
            "resp_has_stack_trace": float(
                any(kw in resp for kw in ("Traceback", "at line", "  File "))
            ),
        }
