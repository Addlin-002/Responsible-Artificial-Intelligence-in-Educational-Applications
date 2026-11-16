
const auditForm = document.getElementById("auditForm");
const contentInput = document.getElementById("content");
const charCount = document.getElementById("charCount");
const analyzeButton = document.getElementById("analyzeButton");
const auditMessage = document.getElementById("auditMessage");

// Character counter
contentInput.addEventListener("input", () => {
    charCount.textContent = contentInput.value.length;
});

// Submit content for AI analysis
auditForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submittedText = contentInput.value.trim();

    if (!submittedText) {
        auditMessage.textContent = "Please enter educational content.";
        return;
    }

    const auditData = {
        text: submittedText,
        content_type: document.getElementById("contentType").value,
        education_level: document.getElementById("educationLevel").value,
        subject: document.getElementById("subject").value.trim() || "General"
    };

    analyzeButton.disabled = true;
    analyzeButton.textContent = "Analyzing...";
    auditMessage.textContent = "Your educational content is being evaluated by AI. Please wait.";

    try {
        const response = await fetch("/api/audit/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(auditData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || result.message || "Analysis failed.");
        }

        // Temporarily store the analysis for the results page
        sessionStorage.setItem("auditResult", JSON.stringify(result));

        window.location.href = "/audit/result";

    } catch (error) {
        console.error("Audit error:", error);
        auditMessage.textContent = error.message || "Something went wrong. Please try again.";
    } finally {
        analyzeButton.disabled = false;
        analyzeButton.textContent = "Analyze Educational Content";
    }
});

// Logout
const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST"
            });

            if (response.ok) {
                window.location.href = "/login";
            } else {
                alert("Unable to log out. Please try again.");
            }
        } catch (error) {
            alert("Could not connect to the server.");
        }
    });
}
