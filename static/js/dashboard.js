
const totalAudits = document.getElementById("totalAudits");
const lowRiskAudits = document.getElementById("lowRiskAudits");
const mediumRiskAudits = document.getElementById("mediumRiskAudits");
const highRiskAudits = document.getElementById("highRiskAudits");

const recentAuditsSection = document.querySelector(".recent-audits");
const emptyState = document.querySelector(".empty-state");

// Fetch the logged-in user's audit history
async function loadDashboardData() {
    try {
        const response = await fetch("/api/audit/history");
        const result = await response.json();

        if (response.status === 401) {
            window.location.href = "/login";
            return;
        }

        if (!response.ok) {
            throw new Error(result.error || "Unable to load dashboard data");
        }

        const audits = result.history || [];

        // Calculate risk statistics
        let low = 0;
        let medium = 0;
        let high = 0;

        audits.forEach(audit => {
            const risk = (audit.analysis?.overall_risk || "").toLowerCase();

            if (risk === "low") low++;
            else if (risk === "medium") medium++;
            else if (risk === "high") high++;
        });

        // Update dashboard statistics
        totalAudits.textContent = audits.length;
        lowRiskAudits.textContent = low;
        mediumRiskAudits.textContent = medium;
        highRiskAudits.textContent = high;

        // Display the five most recent audits
        displayRecentAudits(audits.slice(0, 5));

    } catch (error) {
        console.error("Dashboard error:", error);
    }
}


// Display recent audit records
function displayRecentAudits(audits) {
    if (!audits.length) {
        return;
    }

    emptyState.innerHTML = "";

    audits.forEach(audit => {
        const card = document.createElement("article");
        card.className = "recent-audit-item";

        const heading = document.createElement("h3");
        heading.textContent = audit.subject || "General";

        const risk = document.createElement("span");
        const riskLevel = audit.analysis?.overall_risk || "Unknown";
        risk.className = `history-risk ${riskLevel.toLowerCase()}`;
        risk.textContent = `${riskLevel} Risk`;

        const preview = document.createElement("p");
        const content = audit.submitted_text || "";
        preview.textContent = content.length > 120
            ? content.substring(0, 120) + "..."
            : content;

        const score = document.createElement("p");
        score.textContent =
            `Overall Score: ${audit.analysis?.overall_score ?? "--"}/100`;

        const button = document.createElement("button");
        button.className = "view-report-button";
        button.textContent = "View Report";

        button.addEventListener("click", () => {
            const savedResult = {
                status: "success",
                audit_id: audit.audit_id,
                submitted_text: audit.submitted_text,
                content_type: audit.content_type,
                education_level: audit.education_level,
                subject: audit.subject,
                analysis: audit.analysis,
                fact_check: audit.fact_check || {
                    total_claims: 0,
                    results: []
                }
            };

            sessionStorage.setItem(
                "auditResult",
                JSON.stringify(savedResult)
            );

            window.location.href = "/audit/result";
        });

        card.append(heading, risk, preview, score, button);
        emptyState.appendChild(card);
    });
}


// Logout
document.getElementById("logoutButton").addEventListener("click", async () => {
    try {
        await fetch("/api/auth/logout", { method: "POST" });
    } finally {
        sessionStorage.removeItem("auditResult");
        window.location.href = "/login";
    }
});


// Load dashboard when the page opens
loadDashboardData();
