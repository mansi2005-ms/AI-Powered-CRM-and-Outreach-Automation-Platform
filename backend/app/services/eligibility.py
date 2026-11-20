def is_eligible_for_campaign(opportunity):
    score = opportunity["score"]
    is_suppressed = opportunity.get("is_suppressed", False)

    if is_suppressed:
        return "Strictly Not Eligible"

    if score >= 80:
        return "Eligible"
    elif score >= 60:
        return "Researcher Review Required"
    else:
        return "Held"