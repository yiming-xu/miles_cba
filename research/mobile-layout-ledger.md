# Mobile calculator participation release

Prior release fbc8a565f0a940c315bdc4cd02da07a48e5a5644. User authorised mobile-focused simplification and deployment in ongoing project.

Executed: compact mobile opening and sticky result, four section links, short offer labels with full terms retained, existing nodes moved into two collapsed Advanced assumptions groups and section-level help. No model, fee, source or slide changes. Bindings/IDs preserved by moving rather than cloning nodes. Layout script works desktop too; mobile-only appearance overrides scoped <=600px.

Verified:390px browser viewport no horizontal overflow; fare field starts734px rather than1387px; sticky68px rather than113px; page4001px rather than5842px.360px viewport no horizontal overflow; inputs16px, help44px; manual700produces480net.19runtime checks include moved controls, all7offers and fees, all12destinations, invalid inputs and slides;13Python checks. Physical phone/native dropdown/OSkeyboard not tested.

Rollback: git revert <this mobile release commit> and push origin main with approved runner. No services, credentials or other projects changed. Deployment verification pending.
