# =============================================================
# src/feature_engineering.py
# =============================================================
# PURPOSE:
#   Reads all 5 raw CSV files, merges them on event_id,
#   engineers 20+ features the ML models will train on,
#   and returns a clean DataFrame ready for training.
#
# WHY EACH FEATURE WAS CHOSEN:
#   Every feature directly maps to the ML output fields:
#   retry_success_probability, risk_level, forecast,
#   predicted_recovery_time, failure_patterns.
#
# DATASETS USED:
#   webhook_events.csv     → payload_size, priority, event_type
#   delivery_attempts.csv  → retry_attempts, latency, timeout freq, http status
#   endpoints.csv          → endpoint health, rate limit, active status
#   replay_actions.csv     → replay history, duplicate risk
#   labels_train.csv       → delivery_state, failure_reason, safe_to_replay (TARGETS)
# =============================================================

import pandas as pd
import numpy as np


def load_and_merge(data_dir: str) -> pd.DataFrame:
    """
    Loads all CSVs, merges into one event-level DataFrame.
    Each row = one webhook event with all its features.
    """
    # ── 1. Load raw files ────────────────────────────────────
    events   = pd.read_csv(f"{data_dir}/webhook_events.csv")
    attempts = pd.read_csv(f"{data_dir}/delivery_attempts.csv")
    endpoints= pd.read_csv(f"{data_dir}/endpoints.csv")
    replays  = pd.read_csv(f"{data_dir}/replay_actions.csv")
    labels   = pd.read_csv(f"{data_dir}/labels_train.csv")

    # ── 2. Aggregate delivery_attempts to event level ─────────
    # One event can have multiple delivery attempts.
    # We need one row per event → aggregate.
    agg = attempts.groupby("event_id").agg(
        retry_attempts        = ("attempt_number",   "count"),
        max_attempt_number    = ("attempt_number",   "max"),
        avg_response_time_ms  = ("response_time_ms", "mean"),
        max_response_time_ms  = ("response_time_ms", "max"),
        min_response_time_ms  = ("response_time_ms", "min"),
        std_response_time_ms  = ("response_time_ms", "std"),
        timeout_count         = ("timeout",          "sum"),
        retry_scheduled_count = ("retry_scheduled",  "sum"),
        success_count         = ("http_status",      lambda x: (x == 200).sum()),
        error_4xx_count       = ("http_status",      lambda x: ((x >= 400) & (x < 500)).sum()),
        error_5xx_count       = ("http_status",      lambda x: ((x >= 500) & (x < 600)).sum()),
        # Most common http status for this event
        dominant_http_status  = ("http_status",      lambda x: x.mode()[0]),
        # Rate-limited hits
        rate_limited_count    = ("http_status",      lambda x: (x == 429).sum()),
        # Payload too large hits (413)
        payload_error_count   = ("http_status",      lambda x: (x == 413).sum()),
        # Signature validation failures
        invalid_sig_count     = ("signature_valid",  lambda x: (~x).sum()),
    ).reset_index()

    # Derived ratio features
    agg["timeout_frequency"]     = agg["timeout_count"]         / agg["retry_attempts"]
    agg["success_rate_attempts"] = agg["success_count"]         / agg["retry_attempts"]
    agg["error_rate_4xx"]        = agg["error_4xx_count"]       / agg["retry_attempts"]
    agg["error_rate_5xx"]        = agg["error_5xx_count"]       / agg["retry_attempts"]
    agg["retry_scheduled_rate"]  = agg["retry_scheduled_count"] / agg["retry_attempts"]
    agg["latency_volatility"]    = (
        agg["std_response_time_ms"].fillna(0) / agg["avg_response_time_ms"].replace(0, 1)
    )

    # ── 3. Merge webhook_events ───────────────────────────────
    df = events.merge(agg, on="event_id", how="inner")

    # ── 4. Merge endpoints via customer_id ───────────────────
    # endpoints has customer_id → join that to event customer_id
    ep_cols = ["customer_id", "avg_success_rate", "rate_limit_per_minute",
               "active", "endpoint_url_type", "expected_signature_version"]
    df = df.merge(endpoints[ep_cols], on="customer_id", how="left")

    # ── 5. Merge replay_actions ───────────────────────────────
    ra_agg = replays.groupby("event_id").agg(
        replay_count          = ("replayed_at",       "count"),
        duplicate_detected    = ("duplicate_detected", "max"),
        manually_triggered    = ("manually_triggered", "max"),
        replay_success_count  = ("replay_result",     lambda x: (x == "success").sum()),
        replay_failed_count   = ("replay_result",     lambda x: (x == "failed").sum()),
        replay_duplicate_count= ("replay_result",     lambda x: (x == "duplicate_skipped").sum()),
    ).reset_index()
    df = df.merge(ra_agg, on="event_id", how="left")
    df["replay_count"]           = df["replay_count"].fillna(0)
    df["duplicate_detected"]     = df["duplicate_detected"].fillna(False).astype(int)
    df["manually_triggered"]     = df["manually_triggered"].fillna(False).astype(int)
    df["replay_success_count"]   = df["replay_success_count"].fillna(0)
    df["replay_failed_count"]    = df["replay_failed_count"].fillna(0)
    df["replay_duplicate_count"] = df["replay_duplicate_count"].fillna(0)

    # ── 6. Merge labels (TRAINING TARGETS) ───────────────────
    df = df.merge(labels, on="event_id", how="inner")

    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Encodes categorical columns and creates final feature set.
    Returns cleaned DataFrame with all numeric features + targets.
    """

    # ── Priority encoding ─────────────────────────────────────
    priority_map = {"low": 0, "normal": 1, "high": 2}
    df["priority_encoded"] = df["priority"].map(priority_map).fillna(1)

    # ── Event type encoding ───────────────────────────────────
    # Each event_type becomes its own binary flag
    event_dummies = pd.get_dummies(df["event_type"], prefix="evt")
    df = pd.concat([df, event_dummies], axis=1)

    # ── Endpoint URL type encoding ────────────────────────────
    url_dummies = pd.get_dummies(df["endpoint_url_type"], prefix="url")
    df = pd.concat([df, url_dummies], axis=1)

    # ── Signature version encoding ────────────────────────────
    sig_dummies = pd.get_dummies(df["expected_signature_version"], prefix="sig")
    df = pd.concat([df, sig_dummies], axis=1)

    # ── Endpoint active flag ──────────────────────────────────
    df["endpoint_active"] = df["active"].fillna(True).astype(int)

    # ── Payload size bucketing ────────────────────────────────
    # Payload > 50KB is a common failure cause (413 errors)
    df["payload_large_flag"] = (df["payload_size_kb"] > 50).astype(int)
    df["payload_size_kb"]    = df["payload_size_kb"].fillna(df["payload_size_kb"].median())

    # ── Rate limit pressure ───────────────────────────────────
    # How close is retry_attempts to the endpoint's rate limit?
    df["rate_limit_pressure"] = df["retry_attempts"] / df["rate_limit_per_minute"].replace(0, 1)

    # ── Log transform high-skew columns ──────────────────────
    for col in ["avg_response_time_ms", "max_response_time_ms", "payload_size_kb"]:
        df[f"log_{col}"] = np.log1p(df[col].fillna(0))

    # ── TARGET 1: risk_level (for Risk Classifier) ───────────
    def derive_risk(row):
        if row["delivery_state"] == "delivered":
            return "low"
        elif row["delivery_state"] in ["recovered"]:
            return "medium"
        else:
            return "high"
    df["risk_label"] = df.apply(derive_risk, axis=1)

    # ── TARGET 2: retry_will_succeed (for Success Predictor) ──
    df["retry_will_succeed"] = (
        df["delivery_state"].isin(["delivered", "recovered"])
    ).astype(int)

    # ── TARGET 3: failure_pattern (for Pattern Detector) ──────
    def derive_pattern(row):
        if row["timeout_count"] > 1:
            return "timeout_spike"
        elif row["duplicate_detected"] == 1 or row["replay_duplicate_count"] > 0:
            return "duplicate_retry_loop"
        elif row["rate_limited_count"] > 0:
            return "rate_limit_burst"
        elif row["error_5xx_count"] > 1:
            return "unstable_endpoint"
        elif row["payload_error_count"] > 0:
            return "payload_too_large"
        else:
            return "normal"
    df["failure_pattern"] = df.apply(derive_pattern, axis=1)

    return df


def get_feature_columns(df: pd.DataFrame) -> list:
    """
    Returns the final list of numeric feature columns for training.
    Excludes IDs, raw strings, and target columns.
    """
    exclude = {
        "event_id", "customer_id", "invoice_id", "created_at",
        "idempotency_key", "event_type", "priority", "endpoint_url_type",
        "expected_signature_version", "active",
        # targets
        "delivery_state", "failure_reason", "safe_to_replay",
        "recommended_action", "risk_label", "retry_will_succeed",
        "failure_pattern",
    }
    return [c for c in df.columns if c not in exclude and df[c].dtype != object]


if __name__ == "__main__":
    df = load_and_merge("/tmp/webhook_data")
    df = engineer_features(df)
    features = get_feature_columns(df)
    print(f"Total rows: {len(df)}")
    print(f"Total features: {len(features)}")
    print(f"Features: {features}")
    print(f"\nTarget distributions:")
    print("risk_label:\n",         df["risk_label"].value_counts())
    print("retry_will_succeed:\n", df["retry_will_succeed"].value_counts())
    print("failure_pattern:\n",    df["failure_pattern"].value_counts())