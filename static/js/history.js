
const historyList = document.getElementById("historyList");
const historyMessage = document.getElementById("historyMessage");
const searchInput = document.getElementById("searchInput");
const riskFilter = document.getElementById("riskFilter");

let auditRecords = [];

// Fetch audit history from Flask
async function loadAuditHistory() {
    try {
        const response = await fetch("/api/audit/history");
        const result = await response.json();

        if (response.status === 401) {
            window.location.href = "/login";
            return;
        }

        if (!response.ok) {
            throw new Error(result.message || result.error || "Could not load history");
        }

        auditRecords = result.history || [];

        historyMessage.textContent = auditRecords.length
            ? `${result.total_audits} previous audit(s) found.`
            : "";

        renderHistory();

    } catch (error) {
        historyMessage.textContent = error.message;
    }
}


// Display audit cards
function renderHistory() {
    historyList.innerHTML = "";

    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedRisk = riskFilter.value;

    const filteredRecords = auditRecords.filter(record => {
        const subject = (record.subject || "").toLowerCase();
        const content = (record.submitted_text || "").toLowerCase();
        const risk = record.analysis?.overall_risk || "";

        const matchesSearch =
            subject.includes(searchTerm) ||
            content.includes(searchTerm);

        const matchesRisk =
            selectedRisk === "all" || risk === selectedRisk;

        return matchesSearch && matchesRisk;
    });

    if (filteredRecords.length === 0) {
        historyMessage.textContent = "";
        
        const emptyState = document.createElement("div");
        emptyState.className = "history-empty";

        const heading = document.createElement("h3");
        heading.textContent = "No audits found";

        const message = document.createElement("p");
        message.textContent = auditRecords.length
            ? "Try changing your search or risk filter."
            : "You haven't performed any audits yet.";

        emptyState.append(heading, message);
        historyList.appendChild(emptyState);
        return;
    }

    historyMessage.textContent =
        `${filteredRecords.length} audit(s) displayed.`;

    filteredRecords.forEach(record => {
        const card = document.createElement("article");
        card.className = "history-card";

        const header = document.createElement("div");
        header.className = "history-card-header";

        const title = document.createElement("h3");
        title.textContent = record.subject || "General";

        const risk = record.analysis?.overall_risk || "Unknown";
        const riskBadge = document.createElement("span");
        riskBadge.className = `history-risk ${risk.toLowerCase()}`;
        riskBadge.textContent = `${risk} Risk`;

        header.append(title, riskBadge);

        const preview = document.createElement("p");
        const submittedText = record.submitted_text || "";
        preview.textContent = submittedText.length > 180
            ? submittedText.substring(0, 180) + "..."
            : submittedText;

        const meta = document.createElement("div");
        meta.className = "history-meta";

        const score = document.createElement("span");
        score.textContent =
            `Overall Score: ${record.analysis?.overall_score ?? "--"}/100`;

        const type = document.createElement("span");
        type.textContent = record.content_type || "Educational content";

        const date = document.createElement("span");
        date.textContent = new Date(record.created_at).toLocaleString();

        meta.append(score, type, date);

        const actions = document.createElement("div");
        actions.className = "history-actions";

        const viewButton = document.createElement("button");
        viewButton.className = "view-report-button";
        viewButton.textContent = "View Report";

        viewButton.addEventListener("click", () => {
            const savedResult = {
                status: "success",
                audit_id: record.audit_id,
                submitted_text: record.submitted_text,
                content_type: record.content_type,
                education_level: record.education_level,
                subject: record.subject,
                analysis: record.analysis,
                fact_check: record.fact_check || {
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

        actions.appendChild(viewButton);
        card.append(header, preview, meta, actions);
        historyList.appendChild(card);
    });
}


// Search and filter events
searchInput.addEventListener("input", renderHistory);
riskFilter.addEventListener("change", renderHistory);


// Logout
document.getElementById("logoutButton").addEventListener("click", async () => {
    await fetch("/api/auth/logout", {
        method: "POST"
    });

    sessionStorage.removeItem("auditResult");
    window.location.href = "/login";
});


// Load records when the page opens
loadAuditHistory();
