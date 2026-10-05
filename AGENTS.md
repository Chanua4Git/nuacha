# Architecture rules

- Generate social-story images entirely in the authenticated browser and download them as temporary PNG blobs, because private receipt media must never be republished or persisted for sharing.- Derive an account's available balance from its last known balance plus later withdrawals (a slip's printed balance overrides), rather than storing a running total, so edits never drift.
