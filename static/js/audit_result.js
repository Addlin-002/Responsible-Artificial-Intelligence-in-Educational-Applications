
const resultMessage = document.getElementById("resultMessage");

// Retrieve the audit response stored after analysis
const storedResult = sessionStorage.getItem("auditResult");

if (!storedResult) {
    resultMessage.textContent =
        "No audit report found. Please submit educational content first.";
} else {
    try {
        const result = JSON.parse(storedResult);

        if (!result.analysis) {
            throw new Error("The audit response does not contain an analysis.");
        }

        displayAuditResult(result);

    } catch (error) {
        console.error("Result loading error:", error);
        resultMessage.textContent = "Unable to display the audit report.";
    }
}

function displayAuditResult(result) {
    const analysis = result.analysis;

    // Overall risk
    document.getElementById("overallRisk").textContent =
        analysis.overall_risk || "Not available";

    document.getElementById("overallScore").textContent =
        analysis.overall_score ?? "--";

    document.getElementById("overallExplanation").textContent =
        analysis.summary || "Review the individual dimension assessments below.";

    // Submitted content
    const submittedText = result.submitted_text || result.submittedText || "";

    document.getElementById("submittedText").textContent =
        submittedText || "Content details unavailable.";

    document.getElementById("contentType").textContent =
        result.content_type || "Not available";

    document.getElementById("educationLevel").textContent =
        result.education_level || "Not available";

    document.getElementById("subject").textContent =
        result.subject || "Not available";

    // Four auditing dimensions
    const dimensions = analysis.dimensions || {};

    const dimensionNames = {
        safety_toxicity: "Safety & Toxicity",
        fairness_bias: "Fairness & Bias",
        academic_integrity_hallucination:
            "Academic Integrity & Hallucination",
        pedagogical_relevance: "Pedagogical Relevance"
    };

    const dimensionContainer =
        document.getElementById("dimensionResults");

    dimensionContainer.replaceChildren();

    Object.entries(dimensionNames).forEach(([key, name]) => {
        const dimension = dimensions[key];

        if (!dimension) return;

        const risk = String(dimension.risk || "Unknown").toLowerCase();

        const card = document.createElement("article");
        card.className = "dimension-card";

        const heading = document.createElement("h3");
        heading.textContent = name;

        const riskBadge = document.createElement("span");
        riskBadge.className = "dimension-risk risk-" +
            (["low", "medium", "high"].includes(risk) ? risk : "unknown");
        riskBadge.textContent = dimension.risk || "Unknown";

        const score = document.createElement("p");
        score.className = "dimension-score";
        score.textContent = "Score: " +
            (dimension.score ?? "Not available") + "/100";

        const explanation = document.createElement("p");
        explanation.textContent =
            dimension.explanation || "No explanation provided.";

        card.append(heading, riskBadge, score, explanation);

        const findings = Array.isArray(dimension.findings)
            ? dimension.findings
            : [];

        if (findings.length > 0) {
            const findingsHeading = document.createElement("p");
            findingsHeading.textContent = "Findings:";

            const findingsList = document.createElement("ul");
            findingsList.className = "findings-list";

            findings.forEach(item => {
                const listItem = document.createElement("li");
                listItem.textContent = typeof item === "string"
                    ? item
                    : JSON.stringify(item);
                findingsList.appendChild(listItem);
            });

            card.append(findingsHeading, findingsList);
        }

        dimensionContainer.appendChild(card);
    });

    // Recommendations
    const recommendationsList =
        document.getElementById("recommendationsList");

    recommendationsList.replaceChildren();

    const recommendations = Array.isArray(analysis.recommendations)
        ? analysis.recommendations
        : [];

    if (recommendations.length === 0) {
        const item = document.createElement("li");
        item.textContent = "No specific recommendations were generated.";
        recommendationsList.appendChild(item);
    } else {
        recommendations.forEach(recommendation => {
            const item = document.createElement("li");
            item.textContent = typeof recommendation === "string"
                ? recommendation
                : JSON.stringify(recommendation);
            recommendationsList.appendChild(item);
        });
    }

    // Human review
    document.getElementById("humanReview").textContent =
        analysis.human_review_required
            ? "Human review is recommended for this content."
            : "The AI assessment did not flag this content for additional human review. This does not guarantee that the content is error-free.";

     // Limitations
    const limitationsList =
        document.getElementById("limitationsList");

    limitationsList.replaceChildren();

    const limitations = Array.isArray(analysis.limitations)
        ? analysis.limitations
        : [];

    if (limitations.length === 0) {
        const item = document.createElement("li");
        item.textContent = "No limitations were provided.";
        limitationsList.appendChild(item);
    } else {
        limitations.forEach(limitation => {
            const item = document.createElement("li");
            item.textContent = limitation;
            limitationsList.appendChild(item);
        });
    }

    // Factual accuracy and evidence verification
    displayFactCheck(result.fact_check);
}

// Logout functionality
const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST"
            });

            if (response.ok) {
                sessionStorage.removeItem("auditResult");
                window.location.href = "/login";
            } else {
                alert("Unable to log out. Please try again.");
            }
        } catch (error) {
            alert("Could not connect to the server.");
        }
    });
}

// Factual Accuracy & Evidence Verification
function displayFactCheck(factCheck) {
    const totalClaims = document.getElementById("totalClaims");
    const resultsContainer = document.getElementById("factCheckResults");
    const message = document.getElementById("factCheckMessage");

    if (!totalClaims || !resultsContainer || !message) {
        console.error("Fact-check HTML elements were not found.");
        return;
    }

    resultsContainer.replaceChildren();

    const results = Array.isArray(factCheck?.results)
        ? factCheck.results
        : [];

    totalClaims.textContent = factCheck?.total_claims ?? results.length;

    if (results.length === 0) {
        message.textContent =
            "No verifiable factual claims were identified in this content.";
        return;
    }

    message.textContent = "";

    results.forEach(item => {
        const card = document.createElement("article");
        card.className = "fact-check-card";

        // Claim
        const claimHeading = document.createElement("h3");
        claimHeading.textContent = "Claim";

        const claimText = document.createElement("p");
        claimText.textContent = item.claim || "Claim unavailable.";

        // Verdict
        const verdict = String(item.verdict || "Unverified");
        const allowedVerdicts = [
            "Supported",
            "Contradicted",
            "Mixed",
            "Unverified"
        ];

        const safeVerdict = allowedVerdicts.includes(verdict)
            ? verdict
            : "Unverified";

        const verdictBadge = document.createElement("span");
        verdictBadge.className =
            "fact-check-verdict verdict-" + safeVerdict.toLowerCase();
        verdictBadge.textContent = safeVerdict;

        // Confidence
        const confidence = document.createElement("p");
        confidence.className = "fact-check-confidence";
        confidence.textContent =
            "Confidence: " + (item.confidence || "Low");

        // Explanation
        const explanationHeading = document.createElement("h4");
        explanationHeading.textContent = "Evidence assessment";

        const explanation = document.createElement("p");
        explanation.textContent =
            item.explanation || "No explanation available.";

        card.append(
            claimHeading,
            claimText,
            verdictBadge,
            confidence,
            explanationHeading,
            explanation
        );

        // Sources
        const sources = Array.isArray(item.sources) ? item.sources : [];

        if (sources.length > 0) {
            const sourcesHeading = document.createElement("h4");
            sourcesHeading.textContent = "Sources";

            const sourcesList = document.createElement("ul");
            sourcesList.className = "fact-check-sources";

            sources.forEach(source => {
                const listItem = document.createElement("li");

                const link = document.createElement("a");

                try {
                    const url = new URL(source.url);

                    if (
                        url.protocol === "https:" ||
                        url.protocol === "http:"
                    ) {
                        link.href = url.href;
                        link.target = "_blank";
                        link.rel = "noopener noreferrer";
                        link.textContent =
                            source.title || "View evidence source";

                        listItem.appendChild(link);
                    } else {
                        listItem.textContent =
                            source.title || "Source URL unavailable.";
                    }
                } catch {
                    listItem.textContent =
                        source.title || "Source URL unavailable.";
                }

                sourcesList.appendChild(listItem);
            });

            card.append(sourcesHeading, sourcesList);
        } else {
            const noSources = document.createElement("p");
            noSources.textContent = "No sources were available.";
            card.appendChild(noSources);
        }

        resultsContainer.appendChild(card);
    });
}
